import { writeFile } from 'node:fs/promises';
import { AST_NODES, astNodeNamesWithFieldOrder } from './ast-types.js';
import { generateNotEditFilesComment, lintRustFile, toScreamingSnakeCase } from './helpers.js';

const BYTES_PER_U32 = 4;

const notEditFilesComment = generateNotEditFilesComment(import.meta.url);

const astConstantsFile = new URL(
	'../rust/parse_ast/src/convert_ast/converter/ast_constants.rs',
	import.meta.url
);

// Nodes with suffix _SIMPLE have at most one variable child that does not need
// an indirect reference (e.g. one non-optional AST Node or a list of AST Nodes)
// and can use "add_type_and_start_simple"

const nodeTypes = astNodeNamesWithFieldOrder
	.map(
		({ name }, index) =>
			`pub const TYPE_${toScreamingSnakeCase(name)}: [u8; 4] = ${index}u32.to_ne_bytes();`
	)
	.join('\n');

const reservedBytesAndOffsets = astNodeNamesWithFieldOrder
	.map(({ name, fields }) => {
		const { flags, hasSameFieldsAs } = AST_NODES[name];
		if (hasSameFieldsAs) {
			return '';
		}
		/** @type {string[]} */
		const lines = [];
		// reservedBytes is the number of bytes reserved for
		// - end position
		// - flags if present
		// - non-inlined fields
		let reservedBytes = BYTES_PER_U32;
		if (flags) {
			lines.push(`pub const ${toScreamingSnakeCase(name)}_FLAGS_OFFSET: usize = ${reservedBytes};`);
			reservedBytes += BYTES_PER_U32;
			for (const [index, flag] of flags.entries()) {
				lines.push(
					`pub const ${toScreamingSnakeCase(name)}_${toScreamingSnakeCase(flag)}_FLAG: u32 = ${
						1 << index
					};`
				);
			}
		}
		for (const [fieldName, fieldType] of fields) {
			lines.push(
				`pub const ${toScreamingSnakeCase(name)}_${toScreamingSnakeCase(
					fieldName
				)}_OFFSET: usize = ${reservedBytes};`
			);
			switch (fieldType) {
				case 'Float': {
					reservedBytes += 8;
					break;
				}
				default: {
					reservedBytes += BYTES_PER_U32;
				}
			}
		}
		lines.unshift(
			`pub const ${toScreamingSnakeCase(name)}_RESERVED_BYTES: usize = ${reservedBytes};`
		);
		return `${lines.join('\n')}\n`;
	})
	.join('\n');

const astConstants = `${notEditFilesComment}
${nodeTypes}

${reservedBytesAndOffsets}
`;

await writeFile(astConstantsFile, astConstants);
await lintRustFile(astConstantsFile);
