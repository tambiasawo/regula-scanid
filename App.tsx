import "./style.css";
import { CSSProperties, useEffect, useRef, useState } from "react";
import {
  defineComponents,
  DocumentReaderService,
  EventActions,
  InternalScenarios,
  type DocumentReaderDetailType,
  type DocumentReaderWebComponent,
} from "@regulaforensics/vp-frontend-document-components";
import logo from "./assets/logo-white.png";
import { getDOMForLabel, getFragmentForFields } from "./utils";
import jsPDF from "jspdf";
import { TextExt } from "@regulaforensics/document-reader-webclient";

const containerStyle: CSSProperties = {
  display: "flex",
  position: "absolute",
  height: "100%",
  width: "100%",
  top: 0,
  left: 0,
  justifyContent: "center",
  alignItems: "center",
};

const buttonStyle: CSSProperties = {
  padding: "10px 30px",
  color: "white",
  fontSize: "16px",
  borderRadius: "2px",
  backgroundColor: "#bd7dff",
  border: "1px solid #bd7dff",
  cursor: "pointer",
};

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const elementRef = useRef<DocumentReaderWebComponent>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  let elements: {
    result: HTMLDivElement;
    resultContent: HTMLDivElement;
    resultHeader: HTMLDivElement;
    resultFooter: HTMLDivElement;
    printContent: HTMLDivElement;
  };

  function showResult(isFinish: boolean, fields: TextExt, faceImage: string) {
    const { fieldList } = fields;
    const printButton = document.querySelector("#print")!;
    const emailButton = document.querySelector("#email")!;

    let pdfBlob;

    const result = document.createDocumentFragment();
    // Scanned document result modal Header
    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.flexDirection = "column";
    header.style.alignItems = "center";
    const h2 = document.createElement("h2");
    h2.textContent = isFinish
      ? "ID Verification Result: Successful"
      : "ID Verification Result: Failed";
    h2.style.color = h2.textContent.includes("Successful") ? "green" : "red";

    const img = document.createElement("img");
    img.src = logo;
    img.style.height = "120px";
    header.append(img);

    header.append(h2);
    const foundFields: [string, unknown][] = [];
    foundFields.push(["Verification Result", h2.textContent]);

    if (faceImage) {
      const portraitImage = new Image();
      result.append(getDOMForLabel("Face"));
      portraitImage.src = `data:image/png;base64,${faceImage}`;
      portraitImage.width = 300;
      portraitImage.height = 200;
      // foundFields.push(["Face", portraitImage.src]);
      result.append(portraitImage);
    }

    fieldList.find((field) => {
      const { fieldName, value } = field;
      if (fieldName === "Surname") foundFields.push([fieldName, value]);
      if (fieldName === "Given Names") foundFields.push([fieldName, value]);
      if (fieldName === "Sex") foundFields.push([fieldName, value]);
      if (fieldName === "Age") foundFields.push([fieldName, value]);
      if (fieldName === "Date of Birth") foundFields.push([fieldName, value]);
      if (fieldName === "Address") foundFields.push([fieldName, value]);
      if (fieldName === "Document Type") foundFields.push([fieldName, value]);
      if (fieldName === "Document Number") foundFields.push([fieldName, value]);
      if (fieldName === "Nationality") foundFields.push([fieldName, value]);
      if (fieldName === "Issuing State Name")
        foundFields.push([fieldName, value]);
      if (fieldName === "Date of Expiry") foundFields.push([fieldName, value]);
    });

    // console.log({ foundFields });
    elements.resultHeader.append(header);
    elements.resultContent.textContent = "";

    if (foundFields.length) result.append(getFragmentForFields(foundFields));
    elements.resultContent.append(result);

    const jsPdf: jsPDF = new jsPDF("p", "pt", "letter");

    const resultContentDiv: HTMLElement | null =
      document.querySelector("#result-content");
    if (resultContentDiv) {
      jsPdf.setTextColor(
        h2.textContent && h2.textContent.includes("Successful")
          ? "green"
          : "red"
      );
      console.log({ resultContentDiv });
      jsPdf.text(h2?.textContent as string, 240, 130);
      jsPdf.html(resultContentDiv, {
        callback: function (jsPdf: jsPDF) {
          pdfBlob = jsPdf.output("blob");
        },
        margin: [100, 10, 10, 10],
        autoPaging: "text",
        html2canvas: {
          allowTaint: true,
          letterRendering: true,
          logging: false,
          scale: 0.8,
          useCORS: true,
        },
      });

      printButton.addEventListener("click", () => {
        jsPdf.save("ID_Verification_Result.pdf");
      });
    }

    resultRef.current && (resultRef.current.style.display = "block");
  }

  const listener = (data: CustomEvent<DocumentReaderDetailType>) => {
    if (data.detail.action === EventActions.PROCESS_FINISHED) {
      let faceImage;
      const response = data.detail.data;
      const status = data.detail.data?.status;
      const fields = data.detail.data?.response?.text;
      const isFinishStatus = status === 1 || status === 0;

      if (!isFinishStatus || !data.detail.data?.response) return;

      if (
        response?.images?.fieldList &&
        Array.isArray(response.images.fieldList)
      ) {
        faceImage = response.images.fieldList[1].valueList[0].value;
      }
      if (fields) showResult(isFinishStatus, fields, faceImage);

      //window.RegulaDocumentSDK.finalizePackage();
    }

    if (data.detail?.action === EventActions.CLOSE) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    elements = {
      result: document.getElementById("result") as HTMLDivElement,
      resultContent: document.getElementById(
        "result-content"
      ) as HTMLDivElement,
      resultHeader: document.getElementById("result-header") as HTMLDivElement,
      resultFooter: document.getElementById("result-footer") as HTMLDivElement,
      printContent: document.getElementById("result") as HTMLDivElement,
    };
    const containerCurrent = containerRef.current;
    const resultRefCurrent = resultRef.current;
    resultRefCurrent && (resultRefCurrent.style.display = "none");

    window.RegulaDocumentSDK = new DocumentReaderService();
    window.RegulaDocumentSDK.recognizerProcessParam = {
      processParam: {
        scenario: InternalScenarios.MrzAndLocate,
        multipageProcessing: true,
        returnPackageForReprocess: false,
        timeout: 20000,
        resultTypeOutput: [],
        imageQa: {
          expectedPass: ["dpiThreshold", "glaresCheck", "focusCheck"],
          dpiThreshold: 130,
          glaresCheck: true,
          glaresCheckParams: {
            imgMarginPart: 0.05,
            maxGlaringPart: 0.01,
          },
        },
      },
    };

    window.RegulaDocumentSDK.imageProcessParam = {
      processParam: {
        scenario: InternalScenarios.MrzAndLocate,
      },
    };

    //defineComponents().then(() => window.RegulaDocumentSDK.initialize());
    // To use the document-reader component on test environments, you have to set the base64 license
    defineComponents().then(() =>
      window.RegulaDocumentSDK.initialize({
        license:
          "AAEAACl2CSfHj3j0A1RcPWMWbSzO1SpyfByqgZ+IUlKy8ZzDRu/Eqmf97jAua8mS9f6+oUvM/EzhURAnl5NK6CtqKQQhGR76HSrhJcPDsjBQjopmxspAqHKWOBD3wBYPqKk9IDOKMR48/lSGQeAXll0asItyOMpSeKKRODhszEWrVNvVHSuRIb7Id6fmdB+P3pyt1ztRuF5JQUHdUmElmiWJEIpAkLi/RoDrH4onpNxEik6PplSlsSeJnnNFzLmGoxETNz2yW6QWB+BtNgm3apQkf6YqP/ttwuW8WVzW85TxvTn0+E3DP1vZd4IjTgKAJxRIEKaRui5i/gtFJz2PDJk+QbnkAAAAAAAAEMWPeP9NVCHm/VlhgE75BMZGWhnRRvA5KJJZUTXjvfH08tnOags9EhwRXR7J47I4mVJURKA8O58FjAdHaUsTy8iBVkyhD+sJiwYuGKMWh59nma64EcnF9s6pwoqhw617qOJ6iOaOj2oHBU7waMPQpH1jccV4d0FamcWJQmv+Hqwx1SqPuifQUw9Oyr9QgyUg3lpaqeEtG9XOICkEgAmaNEpvEGiFeCNawZKnpafGa2Wng/eTDs6beiBC5IB3tg/ABeOxzCQhYWNQbEc3z6rcRCzauK8qjRjoRUGwGTw2m5nl",
      })
    );

    if (!containerCurrent) return;

    containerCurrent.addEventListener("document-reader", listener);

    return () => {
      window.RegulaDocumentSDK.shutdown();
      containerCurrent.removeEventListener("document-reader", listener);
    };
  }, []);

  useEffect(() => {
    const elementRefCurrent = elementRef.current;

    if (!elementRefCurrent) return;

    elementRefCurrent.settings = {
      startScreen: true,
      changeCameraButton: true,
    };
  }, [isOpen]);

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <div style={containerStyle} ref={containerRef}>
        {isOpen ? (
          <document-reader ref={elementRef}></document-reader>
        ) : (
          <button style={{ ...buttonStyle }} onClick={() => setIsOpen(true)}>
            Open component
          </button>
        )}
      </div>
      <div
        ref={resultRef}
        style={{
          height: "100%",
          width: "100%",
        }}
      >
        <div id="result">
          <div id="result-header"></div>
          <div id="result-content">hello there</div>
          <div id="result-footer">
            <button
              onClick={() => {
                window.location.replace("https://rented123.com");
              }}
            >
              Close
            </button>
            <button id="print">Download</button>
            <button id="email">Email Myself</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
