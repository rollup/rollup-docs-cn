import type { NodeInteractionWithThisArgument } from '../NodeInteractions';
import type { ObjectPath, PathTracker } from '../utils/PathTracker';
import type Variable from '../variables/Variable';
import type * as NodeType from './NodeType';
import { NodeBase } from './shared/Node';

export default class Super extends NodeBase {
	declare type: NodeType.tSuper;
	declare variable: Variable;

	bind(): void {
		this.variable = this.scope.findVariable('this');
	}

	deoptimizePath(path: ObjectPath): void {
		this.variable.deoptimizePath(path);
	}

	deoptimizeThisOnInteractionAtPath(
		interaction: NodeInteractionWithThisArgument,
		path: ObjectPath,
		recursionTracker: PathTracker
	) {
		this.variable.deoptimizeThisOnInteractionAtPath(interaction, path, recursionTracker);
	}

	include(): void {
		if (!this.included) {
			this.included = true;
			this.context.includeVariableInModule(this.variable);
		}
	}
}
