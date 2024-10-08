import LocalVariable from '../../variables/LocalVariable';
import type Variable from '../../variables/Variable';
import type JSXElement from '../JSXElement';
import type JSXExpressionContainer from '../JSXExpressionContainer';
import type JSXFragment from '../JSXFragment';
import type JSXOpeningElement from '../JSXOpeningElement';
import type JSXOpeningFragment from '../JSXOpeningFragment';
import type JSXSpreadChild from '../JSXSpreadChild';
import type JSXText from '../JSXText';
import type JSXElementBase from './JSXElementBase';

export type JsxMode =
	| {
			mode: 'preserve' | 'classic';
			factory: string | null;
			importSource: string | null;
	  }
	| { mode: 'automatic'; factory: string; importSource: string };
export type JSXChild = JSXText | JSXExpressionContainer | JSXElement | JSXFragment | JSXSpreadChild;

export function getAndIncludeFactoryVariable(
	factory: string,
	preserve: boolean,
	importSource: string | null,
	node: JSXElementBase | JSXOpeningElement | JSXOpeningFragment
): Variable {
	const [baseName, nestedName] = factory.split('.');
	let factoryVariable: Variable;
	if (importSource) {
		factoryVariable = node.scope.context.getImportedJsxFactoryVariable(
			nestedName ? 'default' : baseName,
			node.start,
			importSource
		);
		if (preserve) {
			// This pretends we are accessing an included global variable of the same name
			const globalVariable = node.scope.findGlobal(baseName);
			globalVariable.include();
			// This excludes this variable from renaming
			factoryVariable.globalName = baseName;
		}
	} else {
		factoryVariable = node.scope.findGlobal(baseName);
	}
	node.scope.context.includeVariableInModule(factoryVariable);
	if (factoryVariable instanceof LocalVariable) {
		factoryVariable.consolidateInitializers();
		factoryVariable.addUsedPlace(node);
		node.scope.context.requestTreeshakingPass();
	}
	return factoryVariable;
}
