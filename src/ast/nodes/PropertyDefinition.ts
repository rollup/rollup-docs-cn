import type { DeoptimizableEntity } from '../DeoptimizableEntity';
import type { HasEffectsContext } from '../ExecutionContext';
import type { NodeInteraction, NodeInteractionCalled } from '../NodeInteractions';
import type { ObjectPath, PathTracker } from '../utils/PathTracker';
import { checkEffectForNodes } from '../utils/checkEffectForNodes';
import type Decorator from './Decorator';
import type * as NodeType from './NodeType';
import type PrivateIdentifier from './PrivateIdentifier';
import { Flag, isFlagSet, setFlag } from './shared/BitFlags';
import {
	type ExpressionEntity,
	type LiteralValueOrUnknown,
	UNKNOWN_RETURN_EXPRESSION,
	UnknownValue
} from './shared/Expression';
import { type ExpressionNode, NodeBase } from './shared/Node';

export default class PropertyDefinition extends NodeBase {
	declare key: ExpressionNode | PrivateIdentifier;
	declare static: boolean;
	declare type: NodeType.tPropertyDefinition;
	declare value: ExpressionNode | null;
	declare decorators: Decorator[];

	get computed(): boolean {
		return isFlagSet(this.flags, Flag.computed);
	}
	set computed(value: boolean) {
		this.flags = setFlag(this.flags, Flag.computed, value);
	}

	deoptimizeArgumentsOnInteractionAtPath(
		interaction: NodeInteraction,
		path: ObjectPath,
		recursionTracker: PathTracker
	): void {
		this.value?.deoptimizeArgumentsOnInteractionAtPath(interaction, path, recursionTracker);
	}

	deoptimizePath(path: ObjectPath): void {
		this.value?.deoptimizePath(path);
	}

	getLiteralValueAtPath(
		path: ObjectPath,
		recursionTracker: PathTracker,
		origin: DeoptimizableEntity
	): LiteralValueOrUnknown {
		return this.value
			? this.value.getLiteralValueAtPath(path, recursionTracker, origin)
			: UnknownValue;
	}

	getReturnExpressionWhenCalledAtPath(
		path: ObjectPath,
		interaction: NodeInteractionCalled,
		recursionTracker: PathTracker,
		origin: DeoptimizableEntity
	): [expression: ExpressionEntity, isPure: boolean] {
		return this.value
			? this.value.getReturnExpressionWhenCalledAtPath(path, interaction, recursionTracker, origin)
			: UNKNOWN_RETURN_EXPRESSION;
	}

	hasEffects(context: HasEffectsContext): boolean {
		return (
			this.key.hasEffects(context) ||
			(this.static && !!this.value?.hasEffects(context)) ||
			checkEffectForNodes(this.decorators, context)
		);
	}

	hasEffectsOnInteractionAtPath(
		path: ObjectPath,
		interaction: NodeInteraction,
		context: HasEffectsContext
	): boolean {
		return !this.value || this.value.hasEffectsOnInteractionAtPath(path, interaction, context);
	}

	protected applyDeoptimizations() {}
}
