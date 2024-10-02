use swc_ecma_ast::TplElement;

use crate::convert_ast::converter::AstConverter;
use crate::{store_template_element, store_template_element_flags};

impl<'a> AstConverter<'a> {
  pub(crate) fn store_template_element(&mut self, template_element: &TplElement) {
    store_template_element!(
      self,
      span => &template_element.span,
      tail => template_element.tail,
      cooked => template_element.cooked.as_ref(),
      raw => &template_element.raw
    );
  }
}
