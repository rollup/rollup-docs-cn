use swc_atoms::JsWord;
use swc_ecma_ast::ExprStmt;

use crate::convert_ast::converter::AstConverter;
use crate::store_directive;

impl<'a> AstConverter<'a> {
  pub(crate) fn store_directive(&mut self, expression_statement: &ExprStmt, directive: &JsWord) {
    store_directive!(
      self,
      span => expression_statement.span,
      directive => directive,
      expression => [expression_statement.expr, convert_expression]
    );
  }
}
