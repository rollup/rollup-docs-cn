import type MagicString from 'magic-string';
import type { DeoptimizableEntity } from '../DeoptimizableEntity';
import type { HasEffectsContext } from '../ExecutionContext';
import type { ObjectPath, PathTracker } from '../utils/PathTracker';
import type CallExpression from './CallExpression';
import type MemberExpression from './MemberExpression';
import type * as NodeType from './NodeType';
import type { LiteralValueOrUnknown } from './shared/Expression';
import { NodeBase } from './shared/Node';

export default class ChainExpression extends NodeBase implements DeoptimizableEntity {
	declare expression: CallExpression | MemberExpression;
	declare type: NodeType.tChainExpression;

	// deoptimizations are not relevant as we are not caching values
	deoptimizeCache(): void {}

	getLiteralValueAtPath(
		path: ObjectPath,
		recursionTracker: PathTracker,
		origin: DeoptimizableEntity
	): LiteralValueOrUnknown {
		if (this.expression.isSkippedAsOptional(origin)) return undefined;
		return this.expression.getLiteralValueAtPath(path, recursionTracker, origin);
	}

	hasEffects(context: HasEffectsContext): boolean {
		if (this.expression.isSkippedAsOptional(this)) return false;
		return this.expression.hasEffects(context);
	}

	removeAnnotations(code: MagicString) {
		this.expression.removeAnnotations(code);
	}
}
