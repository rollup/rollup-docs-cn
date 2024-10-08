// 具名导出
// 有很多种方法可以从 ES2015 模块中
// 导出绑定
export var foo = 1;

export function bar() {
	// 在生成 CommonJS 时
	// 尝试将此更改为 `foo++`
	return foo;
}

function baz() {
	return bar();
}

export * from './qux';
export { baz };
