import type MagicString from 'magic-string';
import { NO_SEMICOLON, type RenderOptions } from '../../utils/renderHelpers';
import type { HasEffectsContext, InclusionContext } from '../ExecutionContext';
import BlockScope from '../scopes/BlockScope';
import type ChildScope from '../scopes/ChildScope';
import { EMPTY_PATH } from '../utils/PathTracker';
import type MemberExpression from './MemberExpression';
import type * as NodeType from './NodeType';
import type VariableDeclaration from './VariableDeclaration';
import { UNKNOWN_EXPRESSION } from './shared/Expression';
import {
	type ExpressionNode,
	type IncludeChildren,
	StatementBase,
	type StatementNode
} from './shared/Node';
import type { PatternNode } from './shared/Pattern';
import { hasLoopBodyEffects, includeLoopBody } from './shared/loops';

export default class ForInStatement extends StatementBase {
	declare body: StatementNode;
	declare left: VariableDeclaration | PatternNode | MemberExpression;
	declare right: ExpressionNode;
	declare type: NodeType.tForInStatement;

	createScope(parentScope: ChildScope): void {
		this.scope = new BlockScope(parentScope);
	}

	hasEffects(context: HasEffectsContext): boolean {
		const { body, deoptimized, left, right } = this;
		if (!deoptimized) this.applyDeoptimizations();
		if (left.hasEffectsAsAssignmentTarget(context, false) || right.hasEffects(context)) return true;
		return hasLoopBodyEffects(context, body);
	}

	include(context: InclusionContext, includeChildrenRecursively: IncludeChildren): void {
		const { body, deoptimized, left, right } = this;
		if (!deoptimized) this.applyDeoptimizations();
		this.included = true;
		left.includeAsAssignmentTarget(context, includeChildrenRecursively || true, false);
		right.include(context, includeChildrenRecursively);
		includeLoopBody(context, body, includeChildrenRecursively);
	}

	initialise() {
		super.initialise();
		this.left.setAssignedValue(UNKNOWN_EXPRESSION);
	}

	render(code: MagicString, options: RenderOptions): void {
		this.left.render(code, options, NO_SEMICOLON);
		this.right.render(code, options, NO_SEMICOLON);
		// handle no space between "in" and the right side
		if (code.original.charCodeAt(this.right.start - 1) === 110 /* n */) {
			code.prependLeft(this.right.start, ' ');
		}
		this.body.render(code, options);
	}

	protected applyDeoptimizations(): void {
		this.deoptimized = true;
		this.left.deoptimizePath(EMPTY_PATH);
		this.scope.context.requestTreeshakingPass();
	}
}
