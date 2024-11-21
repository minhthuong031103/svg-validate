"use client";
import React, { useEffect, useState } from "react";
import Prism from "prismjs";
import "prismjs/themes/prism.css"; // Or use another theme like prism-okaidia.css

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
  snippet: string; // Full SVG element snippet
  message: string;
};

const SVGValidator: React.FC = () => {
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [svgContent, setSvgContent] = useState<string>("");

  useEffect(() => {
    // Apply syntax highlighting whenever errors are updated
    Prism.highlightAll();
  }, [errors]);

  const validateSVG = (svg: string) => {
    setErrors([]); // Clear previous errors

    try {
      // Fix syntax issues like &quote
      const fixedSvg = svg.replace(/&quote/g, '"');

      // Parse SVG
      const parser = new DOMParser();
      const doc = parser.parseFromString(fixedSvg, "image/svg+xml");

      // Check for parse errors
      const parseError = doc.querySelector("parsererror");
      if (parseError) {
        throw new Error("Invalid SVG syntax: " + parseError.textContent);
      }

      // Validate each graphic tag
      const newErrors: ValidationError[] = [];
      graphicTags.forEach((tag) => {
        const elements = doc.getElementsByTagName(tag);

        Array.from(elements).forEach((element) => {
          // Extract the element as a string snippet
          const snippet = element.outerHTML;

          // Check for required attributes and their values
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
              });
            } else {
              // Trim the value to check for leading/trailing spaces
              const trimmedValue = attrValue.trim();
              if (attrValue !== trimmedValue) {
                newErrors.push({
                  tag,
                  snippet,
                  message: `<${tag}> attribute "${attr}" has leading or trailing spaces.`,
                });
              }

              // Check for invalid syntax like `&quote`
              if (/&quote/.test(attrValue)) {
                newErrors.push({
                  tag,
                  snippet,
                  message: `<${tag}> attribute "${attr}" contains invalid characters like "&quote".`,
                });
              }
            }
          });
        });
      });

      setErrors(newErrors);
    } catch (error: any) {
      setErrors([{ tag: "N/A", snippet: "", message: error.message }]);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const content = reader.result as string;
        setSvgContent(content);
        validateSVG(content);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div>
      <h1>SVG Validator</h1>
      <input type="file" accept=".svg" onChange={handleFileUpload} />
      <div className="">
        <h2>Validation Errors</h2>
        {errors.length > 0 ? (
          <ul>
            {errors.map((error, index) => (
              <li key={index}>
                <p>
                  <strong>Error:</strong> {error.message}
                </p>
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
    </div>
  );
};

export default SVGValidator;
