import {
    h,
    mount,
    patch
} from './vdom';
//h是用来创建虚拟DOM的,虚拟DOM就是一个普通JS对象,放着类型、属性、儿子们
//DOMDIFF原则 尽量少操作DOM 而且vue domdiff是针对常用DOM操作进行了优化
const root = document.getElementById('root');

/* const oldVnode = h('ul', { id: 'container' },
    h('li', { style: { backgroundColor: '#000011' }, key: '1' }, '1'),
    h('li', { style: { backgroundColor: '#000033' }, key: '2' }, '2'),
    h('li', { style: { backgroundColor: '#000055' }, key: '3' }, '3'),
    h('li', { style: { backgroundColor: '#000077' }, key: '4' }, '4'),
);
const newVnode = h('ul', { id: 'container' },
    h('li', { style: { backgroundColor: '#000099' }, key: '5' }, '5'),
    h('li', { style: { backgroundColor: '#000033' }, key: '2' }, '21'),
    h('li', { style: { backgroundColor: '#000011' }, key: '1' }, '11'),
    h('li', { style: { backgroundColor: '#000077' }, key: '4' }, '41'),
    h('li', { style: { backgroundColor: '#0000AA' }, key: '6' }, '6'),
); */
const oldVnode = h('ul', {
        id: 'container'
    },
    h('li', {
        style: {
            backgroundColor: '#000011'
        },
        id: 'qwe'
    }, '1'),
    h('li', {
        style: {
            backgroundColor: '#000033'
        }
    }, '2'),
    h('li', {
        style: {
            backgroundColor: '#000055'
        }
    }, '3'),
    h('li', {
        style: {
            backgroundColor: '#000077'
        }
    }, '4'),
);
const newVnode = h('ul', {
        id: 'container'
    },
    h('li', {
        style: {
            backgroundColor: '#000011'
        }
    }, '11'),
    h('li', {
        style: {
            backgroundColor: '#000033'
        }
    }, '21'),
    h('li', {
        style: {
            backgroundColor: '#000055'
        }
    }, '31'),
    h('li', {
        style: {
            backgroundColor: '#000077'
        }
    }, '41'),
);
//把虚拟DOM节点挂载到root上面去
mount(oldVnode, root);

setTimeout(function () {
    patch(oldVnode, newVnode);
}, 3000);