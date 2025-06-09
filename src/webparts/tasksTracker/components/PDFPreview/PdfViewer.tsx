/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import React, { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

import "./pdfpreview.css";

interface PdfViewerProps {
  pdfUrl: string | File;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ pdfUrl }) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);

  useEffect(() => {
    setBlobUrl(null);

    if (typeof pdfUrl === "string") {
      // Case: SharePoint or external link
      const fetchPdf = async () => {
        try {
          const res = await fetch(pdfUrl, {
            credentials: "include", // For SharePoint
          });
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          setBlobUrl(url);
        } catch (error) {
          console.error("Failed to fetch PDF:", error);
        }
      };

      fetchPdf();
    } else if (pdfUrl instanceof File) {
      // Case: Local uploaded file
      const url = URL.createObjectURL(pdfUrl);
      setBlobUrl(url);

      // Cleanup blob on unmount
      return () => URL.revokeObjectURL(url);
    }
  }, [pdfUrl]);

  const onLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  return (
    <div className="pdf-preview">
      {blobUrl ? (
        <Document file={blobUrl} onLoadSuccess={onLoadSuccess}>
          {Array.from(new Array(numPages), (_, i) => (
            <div key={`page_${i + 1}`} style={{ marginBottom: "20px" }}>
              <Page pageNumber={i + 1} width={600} />
            </div>
          ))}
        </Document>
      ) : (
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <p style={{ textAlign: "center", color: "#fff" }}>Loading...</p>
        </div>
      )}
    </div>
  );
};

export default PdfViewer;
