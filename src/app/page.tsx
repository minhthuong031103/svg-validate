"use client";

import React, { useEffect, useRef, useState } from "react";
import { Editor, OnMount } from "@monaco-editor/react";
import Prism from "prismjs";
import "prismjs/themes/prism.css";

const graphicTags = [
  "path",
  "polygon",
  "rect",
  "circle",
  "ellipse",
  "line",
  "polyline",
];

type ValidationError = {
  tag: string;
  snippet: string;
  message: string;
  line: number; // Line number in the editor
};

const SVGValidator: React.FC = () => {
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [svgContent, setSvgContent] = useState<string>("");
  const [editorContent, setEditorContent] = useState<string>("");
  const [showSuccessModal, setShowSuccessModal] = useState(false); // Modal state
  const editorRef = useRef<any>(null);

  useEffect(() => {
    Prism.highlightAll();
  }, [errors]);

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  const validateSVG = (svg: string) => {
    setErrors([]);

    try {
      const fixedSvg = svg.replace(/&quote/g, '"');
      const parser = new DOMParser();
      const doc = parser.parseFromString(fixedSvg, "image/svg+xml");

      const parseError = doc.querySelector("parsererror");
      if (parseError) {
        throw new Error("Invalid SVG syntax: " + parseError.textContent);
      }

      const newErrors: ValidationError[] = [];
      const lines = svg.split("\n");

      graphicTags.forEach((tag) => {
        const elements = doc.getElementsByTagName(tag);

        Array.from(elements).forEach((element) => {
          const snippet = element.outerHTML;
          const firstLine = snippet.split("\n")[0];
          const lineIndex = lines.findIndex((line) => line.includes(firstLine));

          const attributes = [
            "data-categoryid",
            "data-targetviewbox",
            "data-zoneid",
          ];
          attributes.forEach((attr) => {
            const attrValue = element.getAttribute(attr);

            if (!attrValue) {
              newErrors.push({
                tag,
                snippet,
                message: `<${tag}> missing attribute: ${attr}`,
                line: lineIndex + 1,
              });
            } else {
              const trimmedValue = attrValue.trim();
              if (attrValue !== trimmedValue) {
                newErrors.push({
                  tag,
                  snippet,
                  message: `<${tag}> attribute "${attr}" has leading or trailing spaces.`,
                  line: lineIndex + 1,
                });
              }

              if (/&quote/.test(attrValue)) {
                newErrors.push({
                  tag,
                  snippet,
                  message: `<${tag}> attribute "${attr}" contains invalid characters like "&quote".`,
                  line: lineIndex + 1,
                });
              }
            }
          });
        });
      });

      setErrors(newErrors);

      if (newErrors.length === 0) {
        setShowSuccessModal(true); // Show modal if no errors
      }
    } catch (error: any) {
      setErrors([
        {
          tag: "N/A",
          snippet: "",
          message: error.message,
          line: 0,
        },
      ]);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const content = reader.result as string;
        setSvgContent(content);
        setEditorContent(content);
        validateSVG(content);
      };
      reader.readAsText(file);
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value) {
      setEditorContent(value);
      validateSVG(value);
    }
  };

  const saveToFile = () => {
    const blob = new Blob([editorContent], { type: "image/svg+xml" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "validated.svg";
    link.click();
  };

  const closeModal = () => {
    setShowSuccessModal(false); // Close modal
  };

  return (
    <div>
      <h1>SVG Validator</h1>
      <input type="file" accept=".svg" onChange={handleFileUpload} />
      <div style={{ marginTop: "20px", height: "500px" }}>
        <Editor
          height="500px"
          defaultLanguage="xml"
          value={editorContent}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            readOnly: false,
            automaticLayout: true,
          }}
        />
      </div>
      <button
        className="bg-black text-white rounded-lg p-2"
        onClick={saveToFile}
        style={{ marginTop: "10px" }}
      >
        Save SVG
      </button>
      <div>
        <h2>Validation Errors</h2>
        {errors.length > 0 ? (
          <ul>
            {errors.map((error, index) => (
              <li key={index}>
                <p>
                  <strong>Error:</strong> {error.message}
                </p>
                {/* <button onClick={() => focusEditorLine(error.line)}>
                  Go to Line
                </button> */}
                <pre
                  className="language-markup"
                  style={{
                    maxWidth: "100%", // Limit width to container
                    overflowX: "auto", // Add horizontal scrolling
                    wordWrap: "break-word", // Allow breaking long words
                    whiteSpace: "pre-wrap", // Preserve whitespace and enable wrapping
                    backgroundColor: "#f8f9fa",
                    padding: "10px",
                    borderRadius: "5px",
                    boxShadow: "inset 0 0 5px rgba(0, 0, 0, 0.1)",
                    fontSize: "0.9em", // Adjust font size
                  }}
                >
                  <code>{error.snippet}</code>
                </pre>
              </li>
            ))}
          </ul>
        ) : (
          <p>No errors found.</p>
        )}
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "#fff",
            padding: "20px",
            borderRadius: "10px",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
            zIndex: 1000,
          }}
        >
          <h2>Validation Successful!</h2>
          <p>Your SVG is valid and contains no errors.</p>
          <button onClick={closeModal}>Close</button>
        </div>
      )}
    </div>
  );
};

export default SVGValidator;
