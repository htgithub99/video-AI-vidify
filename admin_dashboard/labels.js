for (const element of document.querySelectorAll(AdminTextBindings.TEXT_SELECTOR)) {
  element.textContent = AdminRuntimeText[element.getAttribute(AdminTextBindings.TEXT_ATTRIBUTE)] || AdminConstants.EMPTY_STR;
  element.removeAttribute(AdminTextBindings.TEXT_ATTRIBUTE);
}
for (const element of document.querySelectorAll(AdminTextBindings.NODE_SELECTOR)) element.replaceWith(document.createTextNode(AdminRuntimeText[element.getAttribute(AdminTextBindings.NODE_ATTRIBUTE)] || AdminConstants.EMPTY_STR));
for (const [attribute, binding] of Object.entries(AdminTextBindings.ATTRIBUTES))
  for (const element of document.querySelectorAll(AdminTextBindings.attributeSelector(binding))) {
    element.setAttribute(attribute, AdminRuntimeText[element.getAttribute(binding)] || AdminConstants.EMPTY_STR);
    element.removeAttribute(binding);
  }
