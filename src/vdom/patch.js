import {
    isSameNode
} from './vnode';
/**
 * 通过虚拟DOM节点创建真实的DOM节点
 */
function createDOMElementFromVnode(vnode) {
    let {
        type,
        children
    } = vnode; //DOM类型span div
    if (type) {
        //创建真实DOM元素并挂载到vnode上的domElement
        let domElement = vnode.domElement = document.createElement(type);
        updateProperties(vnode);
        if (Array.isArray(children)) {
            children.forEach(child => domElement.appendChild(createDOMElementFromVnode(child)));
        }
    } else {
        //创建文本节点
        vnode.domElement = document.createTextNode(vnode.text);
    }
    //返回真实的DOM节点
    return vnode.domElement;
}

/**
 * 把一个虚拟DOM节点变成真实DOM节点挂载到容器上
 * @param vnode 虚拟DOM节点
 * @param container 容器
 */
export function mount(vnode, container) {
    let newDOMElement = createDOMElementFromVnode(vnode);
    container.appendChild(newDOMElement);
}
//比较老的虚拟DOM节点和新的虚拟DOM节点，并更新真实DOM节点的属性
export function patch(oldVnode, newVnode) {
    //如果新的虚拟DOM节点类型type不一样，直接重建
    if (oldVnode.type !== newVnode.type) {
        return oldVnode.domElement.parentNode.replaceChild(createDOMElementFromVnode(newVnode), oldVnode.domElement);
    }
    //如果是文本
    if (typeof newVnode.text !== 'undefined') {
        return oldVnode.domElement.textContent = newVnode.text;
    }

    //如果类型一样，要继续往下比较 1.比较属性 2比较它的儿子们
    //path就是找出新的虚拟DOM节点和老的虚拟DOM的差异，更新当前页面上的那个真实DOM
    let domElement = newVnode.domElement = oldVnode.domElement; //老的真实DOM节点
    //传入新的虚拟DOM节点和老的属性对象 更新老的真实DOM节点上的属性
    updateProperties(newVnode, oldVnode.props);
    let oldChildren = oldVnode.children; //老的虚拟DOM节点的儿子数组
    let newChildren = newVnode.children; //新的虚拟DOM节点儿子数组
    if (oldChildren.length > 0 && newChildren.length > 0) { //老的有儿子，新的也有儿子
        updateChildren(domElement, oldChildren, newChildren);
    } else if (oldChildren.length > 0) { //老的有儿子，新的没儿子
        domElement.innerHTML = '';
    } else if (newChildren.length > 0) { //老的没有儿子，新的有儿子
        for (let i = 0; i < newChildren.length; i++) {
            domElement.appendChild(createDOMElementFromVnode(newChildren[i]));
        }
    }
}
/*
 生成一个key与旧VNode的key对应的哈希表（只有第一次进来undefined的时候会生成，也为后面检测重复的key值做铺垫）
 比如childre是这样的 [{xx: xx, key: 'key0'}, {xx: xx, key: 'key1'}, {xx: xx, key: 'key2'}]  beginIdx = 0   endIdx = 2  
 结果生成{key0: 0, key1: 1, key2: 2}
 */
function createKeyToIndexMap(children) {
    let map = {};
    for (let i = 0; i < children.length; i++) {
        let key = children[i].key;
        if (key) {
            map[key] = i;
        }
    }
    return map;
}

function updateChildren(parentDomElement, oldChildren, newChildren) {
    let oldStartIndex = 0, //老的开始指针
        oldStartVnode = oldChildren[0], //老的开始索引和老的开始节点
        oldEndIndex = oldChildren.length - 1, //老的结束指针
        oldEndVnode = oldChildren[oldEndIndex], //老的结束索引和老的结束节点

        newStartIndex = 0, //新的开始指针
        newStartVnode = newChildren[0], //新的开始索引和新的开始节点
        newEndIndex = newChildren.length - 1, //新的结束指针
        newEndVnode = newChildren[newEndIndex]; //新的结束索引和新的结束节点
    let oldKeyToIndexMap = createKeyToIndexMap(oldChildren);
    //两个队列都没有循环结束就要继续循环，如果有一个结束，就停止循环
    while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {

        if (!oldStartVnode) { //如果不存在oldStartVnode，则移动指针到下一个节点（不存在的原因是由于对于vnode.key的比较，会把oldVnode = null）
            oldStartVnode = oldChildren[++oldStartIndex];
        } else if (!oldEndVnode) {
            oldEndVnode = oldChildren[--oldEndIndex];
        } else if (isSameNode(oldStartVnode, newStartVnode)) { //老的开始节点和新的开始节点进行比较
            //找到newStartVnode和oldStartVnode的的差异，并且更新到真实DOM上（oldStartVnode.domElement）
            patch(oldStartVnode, newStartVnode);
            oldStartVnode = oldChildren[++oldStartIndex];
            newStartVnode = newChildren[++newStartIndex];
        } else if (isSameNode(oldEndVnode, newEndVnode)) { //老的结束节点和新的结束节点进行比较
            patch(oldEndVnode, newEndVnode);
            oldEndVnode = oldChildren[--oldEndIndex];
            newEndVnode = newChildren[--newEndIndex];
        } else if (isSameNode(oldEndVnode, newStartVnode)) { //老的结束和新的开始节点进行比较 把尾部的元素移动到头部
            patch(oldEndVnode, newStartVnode);
            //移动真实DOM节点
            parentDomElement.insertBefore(oldEndVnode.domElement, oldStartVnode.domElement);
            oldEndVnode = oldChildren[--oldEndIndex];
            newStartVnode = newChildren[++newStartIndex];
        } else if (isSameNode(oldStartVnode, newEndVnode)) { //老的结束和新的开始节点进行比较 把尾部的元素移动到头部
            patch(oldStartVnode, newEndVnode);
            //移动真实DOM节点
            parentDomElement.insertBefore(oldStartVnode.domElement, oldEndVnode.domElement.nextSibling);
            oldStartVnode = oldChildren[++oldStartIndex];
            newEndVnode = newChildren[--newEndIndex];
            //进行DOM移动 把老的开始真实DOM移动真实DOM的尾部
        } else {
            let oldIndexByKey = oldKeyToIndexMap[newStartVnode.key];
            if (oldIndexByKey == null) { //找不到对应的key，需要创建节点并插入真实DOM
                parentDomElement.insertBefore(createDOMElementFromVnode(newStartVnode), oldStartVnode.domElement);
            } else {
                let oldVnodeToMove = oldChildren[oldIndexByKey];
                if (oldVnodeToMove.type !== newStartVnode.type) {
                    parentDomElement.insertBefore(createDOMElementFromVnode(newStartVnode), oldStartVnode.domElement);
                } else {
                    patch(oldVnodeToMove, newStartVnode);
                    /*因为已经patch进去了，所以将这个老节点赋值undefined，之后如果还有新节点与该节点key相同可以检测出来提示已有重复的key*/
                    oldChildren[oldIndexByKey] = undefined;
                    parentDomElement.insertBefore(oldVnodeToMove.domElement, oldStartVnode.domElement);
                }
            }
            newStartVnode = newChildren[++newStartIndex];
        }
    }
    //老的队列处理完了，新的队列没处理完，需要把新的队列的元素插入真实DOM
    if (newStartIndex <= newEndIndex) {
        //我要把这个节点插入到谁的前面
        let beforeDOMElement = newChildren[newEndIndex + 1] == null ? null : newChildren[newEndIndex + 1].domElement;
        for (let i = newStartIndex; i <= newEndIndex; i++) {
            parentDomElement.insertBefore(createDOMElementFromVnode(newChildren[i]), beforeDOMElement);
        }
    }
    //老的队列没处理完，新的队列处理完了，把老的队列没处理完的移出掉
    if (oldStartIndex <= oldEndIndex) {
        for (let i = oldStartIndex; i <= oldEndIndex; i++) {
            parentDomElement.removeChild(oldChildren[i].domElement);
        }
    }
}

function updateProperties(vnode, oldProps = {}) {
    let newProps = vnode.props; //新属性对象
    let domElement = vnode.domElement; //真实DOM
    //先处理样式对象
    let oldStyle = oldProps.style || {};
    let newStyle = newProps.style || {};
    //如果style属性在老的样式对象里有，新的没有，需要删除。如果老的没有，新的有，需要添加
    for (let oldAttrName in oldStyle) { //oldStyle{color:'red',backgroundColor:'green'}
        if (!newStyle[oldAttrName]) {
            domElement.style[oldAttrName] = '';
        }
    }
    //把老的属性对象中的有，新的属性对象里没有的删除
    for (let oldPropName in oldProps) {
        if (!newProps[oldPropName]) {
            // delete domElement[oldPropName];
            domElement.removeAttribute(oldPropName)
        }
    }

    //添加的新的属性
    for (let newPropName in newProps) {
        //样式属性处理
        if (newPropName === 'style') {
            let styleObject = newProps.style; //拿取新的样式对象
            for (let newAttrName in styleObject) {
                domElement.style[newAttrName] = styleObject[newAttrName];
            }
            //普通属性处理
        } else {
            //直接拿新的属性对象中属性的值覆盖掉真实DOM的属性
            domElement[newPropName] = newProps[newPropName];
        }
    }
}