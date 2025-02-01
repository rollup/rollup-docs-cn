import type MagicString from 'magic-string';
import { LOGLEVEL_WARN } from '../../utils/logging';
import { logThisIsUndefined } from '../../utils/logs';
import type { HasEffectsContext, InclusionContext } from '../ExecutionContext';
import type { NodeInteraction } from '../NodeInteractions';
import { INTERACTION_ACCESSED } from '../NodeInteractions';
import ModuleScope from '../scopes/ModuleScope';
import type { EntityPathTracker, ObjectPath } from '../utils/PathTracker';
import { EMPTY_PATH } from '../utils/PathTracker';
import type Variable from '../variables/Variable';
import type * as NodeType from './NodeType';
import { NodeBase } from './shared/Node';

export default class ThisExpression extends NodeBase {
	declare type: NodeType.tThisExpression;
	declare variable: Variable;
	declare private alias: string | null;

	bind(): void {
		this.variable = this.scope.findVariable('this');
	}

	deoptimizeArgumentsOnInteractionAtPath(
		interaction: NodeInteraction,
		path: ObjectPath,
		recursionTracker: EntityPathTracker
	): void {
		this.variable.deoptimizeArgumentsOnInteractionAtPath(interaction, path, recursionTracker);
	}

	deoptimizePath(path: ObjectPath): void {
		this.variable.deoptimizePath(path);
	}

	hasEffectsOnInteractionAtPath(
		path: ObjectPath,
		interaction: NodeInteraction,
		context: HasEffectsContext
	): boolean {
		if (path.length === 0) {
			return interaction.type !== INTERACTION_ACCESSED;
		}
		return this.variable.hasEffectsOnInteractionAtPath(path, interaction, context);
	}

	include(context: InclusionContext): void {
		if (!this.included) this.includeNode(context);
	}

	includeNode(context: InclusionContext) {
		this.included = true;
		if (!this.deoptimized) this.applyDeoptimizations();
		this.scope.context.includeVariableInModule(this.variable, EMPTY_PATH, context);
	}

	includePath(path: ObjectPath, context: InclusionContext): void {
		if (!this.included) {
			this.included = true;
			this.scope.context.includeVariableInModule(this.variable, path, context);
		} else if (path.length > 0) {
			this.variable.includePath(path, context);
		}
	}

	initialise(): void {
		super.initialise();
		this.alias =
			this.scope.findLexicalBoundary() instanceof ModuleScope
				? this.scope.context.moduleContext
				: null;
		if (this.alias === 'undefined') {
			this.scope.context.log(LOGLEVEL_WARN, logThisIsUndefined(), this.start);
		}
	}

	render(code: MagicString): void {
		if (this.alias !== null) {
			code.overwrite(this.start, this.end, this.alias, {
				contentOnly: false,
				storeName: true
			});
		}
	}
}
