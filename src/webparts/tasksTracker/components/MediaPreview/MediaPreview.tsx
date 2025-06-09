/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-floating-promises */
import React, { useEffect, useState } from "react";
import "./MediaPreview.css";
import PdfViewer from "../PDFPreview/PdfViewer";
import heic2any from "heic2any";
import { Button } from "primereact/button";

interface MediaItem {
  url: string;
  name: string;
  fileType: string; // "image" or "pdf"
  fileBlob?: File;
}

interface MediaPreviewProps {
  mediaList: MediaItem[];
  initialIndex?: number;
  onClose: React.Dispatch<React.SetStateAction<boolean>>;
}

const MediaPreview: React.FC<MediaPreviewProps> = ({
  mediaList,
  initialIndex = 0,
  onClose,
}) => {
  console.log("mediaList", mediaList);

  const [currentIndex, setCurrentIndex] = useState<number>(initialIndex);
  const [isLoader, setIsLoader] = useState<boolean>(false);
  const [convertedImageUrl, setConvertedImageUrl] = useState<string | null>(
    null
  );
  const currentItem = mediaList[currentIndex];

  const lowerName = currentItem.name.toLowerCase();
  const isPDF = lowerName.endsWith(".pdf");

  const goNext = () => {
    if (currentIndex < mediaList.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const goPrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  useEffect(() => {
    const convertHEIC = async () => {
      setIsLoader(true);
      const isHeic =
        currentItem.name.toLowerCase().endsWith(".heic") ||
        currentItem.fileType === "image/heic";

      if (isHeic) {
        try {
          const blob = currentItem.fileBlob
            ? currentItem.fileBlob
            : await fetch(currentItem.url).then((res) => res.blob());

          const convertedBlob = await heic2any({ blob, toType: "image/jpeg" });

          const previewUrl = URL.createObjectURL(convertedBlob as Blob);
          setConvertedImageUrl(previewUrl);
        } catch (err) {
          console.error("HEIC conversion failed", err);
          setConvertedImageUrl(null);
        }
      } else {
        setConvertedImageUrl(null);
      }
      setIsLoader(false);
    };

    convertHEIC();
  }, [currentItem]);

  return (
    <div className="media-preview-container">
      <div className="media-header">
        <span className="file-name">{currentItem.name}</span>
        <button className="close-btn" onClick={() => onClose(false)}>
          ✕
        </button>
      </div>

      <div className="media-content">
        {isLoader ? (
          <i
            className="pi pi-spin pi-spinner"
            style={{
              fontSize: "0.8rem",
              marginRight: "7px",
            }}
          />
        ) : isPDF ? (
          <PdfViewer pdfUrl={currentItem.fileBlob ?? currentItem.url} />
        ) : (
          <img
            src={convertedImageUrl || currentItem.url}
            alt={currentItem.name}
          />
        )}
      </div>

      <div className="media-footer">
        <Button
          icon="pi pi-chevron-left"
          rounded
          outlined
          aria-label="Filter"
          onClick={goPrev}
          disabled={currentIndex === 0}
        />
        <span>{`${currentIndex + 1} / ${mediaList.length}`}</span>
        <Button
          icon="pi pi-chevron-right"
          rounded
          outlined
          aria-label="Filter"
          onClick={goNext}
          disabled={currentIndex === mediaList.length - 1}
        />
      </div>
    </div>
  );
};

export default MediaPreview;
