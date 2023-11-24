import type MagicString from 'magic-string';
import { BLANK } from '../../utils/blank';
import type { NodeRenderOptions, RenderOptions } from '../../utils/renderHelpers';
import ChildScope from '../scopes/ChildScope';
import type { IdentifierWithVariable } from './Identifier';
import Identifier from './Identifier';
import * as NodeType from './NodeType';
import FunctionNode from './shared/FunctionNode';
import type { GenericEsTreeNode } from './shared/Node';

export default class FunctionExpression extends FunctionNode {
	declare type: NodeType.tFunctionExpression;
	declare idScope: ChildScope;

	createScope(parentScope: ChildScope) {
		super.createScope((this.idScope = new ChildScope(parentScope, parentScope.context)));
	}

	parseNode(esTreeNode: GenericEsTreeNode) {
		if (esTreeNode.id !== null) {
			this.id = new Identifier(esTreeNode.id, this, this.idScope) as IdentifierWithVariable;
		}
		super.parseNode(esTreeNode);
	}

	render(
		code: MagicString,
		options: RenderOptions,
		{ renderedSurroundingElement }: NodeRenderOptions = BLANK
	): void {
		super.render(code, options);
		if (renderedSurroundingElement === NodeType.ExpressionStatement) {
			code.appendRight(this.start, '(');
			code.prependLeft(this.end, ')');
		}
	}
}
