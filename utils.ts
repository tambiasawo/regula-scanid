function getDOMForLabel(labelText: string): HTMLParagraphElement {
  const paragraph = document.createElement("p");
  paragraph.className = "label";
  paragraph.textContent = labelText;
  return paragraph;
}

function getFragmentForLabelAndValue(
  labelText: string,
  value: unknown
): DocumentFragment {
  const fragment = document.createDocumentFragment();
  fragment.append(getDOMForLabel(labelText, ""));
  fragment.append(getDOMOfFormattedValue(value));

  return fragment;
}

function getFragmentForFields(fields: [string, unknown][]): DocumentFragment {
  let paragraph, paragraphContent;
  const fragment = document.createDocumentFragment();

  for (const [label, value] of fields) {
    if (label === "Verification Result") {
      continue;
    }
    paragraph = getDOMForLabel(label);
    paragraphContent = getDOMForLabel(value);
    fragment.append(paragraph);
    fragment.append(value);
  }
  return fragment;
}
function getFragmentForFields2(fields: [string, unknown][]): DocumentFragment {
  const fragment = document.createDocumentFragment();
  for (const [label, value] of fields) {
    if (label === "Verification Result") {
      continue;
    }
    fragment.append(getFragmentForLabelAndValue(label, value));
  }
  return fragment;
}

function getDOMOfFormattedValue(value: unknown): HTMLElement {
  const paragraph = document.createElement("p");
  const emptyElement = document.createElement("i");
  emptyElement.textContent = "empty";

  if (value == null || value === "") {
    paragraph.append(emptyElement);
    return paragraph;
  }

  if (typeof value === "boolean") {
    paragraph.textContent = value ? "yes" : "no";
    return paragraph;
  }

  if (Array.isArray(value)) {
    for (const element of value) {
      paragraph.append(getDOMOfFormattedValue(element));
    }
    return paragraph;
  }

  paragraph.textContent = value as string;

  return paragraph;
}

export {
  getDOMForLabel,
  getFragmentForFields,
  getDOMOfFormattedValue,
  getFragmentForLabelAndValue,
};
