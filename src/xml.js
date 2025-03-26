const inputXML = document.getElementById("xmlInput");
const outputXML = document.getElementById("xmlOutput");
const copyButton = document.getElementById("copyButton");
const downloadButton = document.getElementById("downloadButton");

const fields = [
  "EMPLID",
  "NATIONAL_ID",
  "PREV_SSN",
  "PREV_ALPHA",
  "Z_DOD_ID",
  "OPRID",
  "ORIGINATORID",
];
class Parser {
  constructor(fieldsArr) {
    this.fields = [];
    this.usedStrings = new Map();
    this.counter = 0;
    /* Skipped Nodes being XML nodes where the children shouldn't be filled in ever , like FieldTypes */
    this.skippedNodes = ["FieldTypes"];

    /* Initialize base fields to anonymize */
    fieldsArr.forEach((field) => {
      this.addField(field);
    });
  }
  addField(fieldName) {
    /* XPATH will assume Upper Case. Remove Spaces */
    // const newField = fieldName.trim().toUpperCase();
    const newField = fieldName.trim();
    /* No spaces in XPATH */
    if (newField.includes(" ")) return;
    /* */
    if (!newField) return;

    /* Check if it field already exists */
    const target = this.fields.findIndex((item) => item.name === newField);
    if (target >= 0) return;

    // if (this.fields.includes(newField)) return;
    const fieldObj = {
      name: newField,
      xmlPath: "//" + newField,
    };
    this.fields.push(fieldObj);
    this.renderFields();
  }
  removeField(fieldName) {
    // const target = this.fields.indexOf(fieldName);
    const target = this.fields.findIndex((item) => item.name === fieldName);
    this.fields.splice(target, 1);
    this.renderFields();
  }

  anonymizeXML(xmlString) {
    const domParser = new DOMParser();
    const xmlDoc = domParser.parseFromString(xmlString, "text/xml");
    if (xmlString.length === 0) return "";
    if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
      copyButton.disabled = true;
      downloadButton.disabled = true;
      return xmlDoc.getElementsByTagName("parsererror")[0].textContent;
      // "error parsing xml";
    } else {
      copyButton.disabled = false;
      downloadButton.disabled = false;
    }

    this.fields.forEach((field) => {
      const nodes = xmlDoc.evaluate(
        field.xmlPath,
        xmlDoc,
        null,
        XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
        null,
      );
      for (let i = 0; i < nodes.snapshotLength; i++) {
        const node = nodes.snapshotItem(i);
        if (node) {
          let skip = false;
          if (node.childNodes.length > 1) {
            continue;
          }
          if (
            node.childNodes.length === 1 &&
            node.childNodes[0].nodeName !== "#text"
          ) {
            continue;
          }
          /* FieldTypes is normally skipped for Integration Broker, since those values aren't filled in. */
          let parent = node.parentNode;
          while (parent) {
            if (this.skippedNodes.includes(parent.nodeName)) {
              skip = true;
              break;
            }
            parent = parent.parentNode;
          }
          if (skip) continue;

          const currentValue = node.textContent || "";
          const replacement = this.generateReplacement(
            field.name,
            currentValue,
          );
          node.textContent = replacement;
        }
      }
    });

    this.counter = 0;
    this.usedStrings.clear();
    const serialzer = new XMLSerializer();
    return serialzer.serializeToString(xmlDoc);
  }

  generateReplacement(fieldName, value) {
    const len = value.length;
    if (!this.usedStrings.has(value)) {
      const newValue = this.counter
        .toString()
        .repeat(value.length)
        .substring(0, value.length);
      this.counter++;
      this.usedStrings.set(value, newValue);
    }
    return this.usedStrings.get(value);
  }
  renderFields() {
    const fieldEl = document.querySelector(".fields");
    const frag = document.createDocumentFragment();
    this.fields.forEach((field) => {
      const el = document.createElement("button");
      el.type = "button";
      el.classList.add("fieldNode");
      el.innerText = "<" + field.name + ">";
      el.setAttribute("title", "Click to remove field from anonymizer.");

      el.addEventListener("click", () => this.removeField(field.name));
      frag.append(el);
    });
    fieldEl.replaceChildren(frag);
  }
}

const addField = () => {
  fields.push(input.value.trim());
};

const processXML = () => {
  outputXML.value = parser.anonymizeXML(inputXML.value);
};

const downloadXML = () => {
  if (outputXML.value) {
    const fileName = "output.xml";
    const link = document.createElement("a");
    const blob = new Blob([outputXML.value], { type: "text/plain" });

    link.setAttribute("href", window.URL.createObjectURL(blob));
    link.setAttribute("download", fileName);
    link.dataset.downloadurl = ["text/plain", link.download, link.href].join(
      ":",
    );
    link.click();
  }
};

const copyXML = () => {
  if (outputXML.value) {
    (async () => {
      try {
        await navigator.clipboard.writeText(outputXML.value);
        copyButton.disabled = true;
        setTimeout(() => {
          copyButton.disabled = false;
        }, 250);
      } catch (error) {
        console.error(error.message);
      }
    })();
  }
};

copyButton.addEventListener("click", copyXML);
downloadButton.addEventListener("click", downloadXML);

document.getElementById("fieldForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = document.getElementById("xpathInput");
  if (!input.value) return;
  parser.addField(input.value);
  input.value = "";
});

const parser = new Parser(fields);
