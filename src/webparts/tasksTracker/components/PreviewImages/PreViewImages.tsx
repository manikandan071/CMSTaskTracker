/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import React, { useState, useEffect } from "react";
import { Carousel } from "primereact/carousel";
import styles from "./PreViewImages.module.scss";
import PdfViewer from "../PDFPreview/PdfViewer";

interface IPreviewImageProps {
  imagesData: any;
  imageIndex: number;
  setImagePreview: React.Dispatch<React.SetStateAction<boolean>>;
}
const PreviewImages: React.FC<IPreviewImageProps> = ({
  imagesData,
  imageIndex,
  setImagePreview,
}) => {
  // export default function PreviewImages(imagesData: any, setImagePreview: any) {

  const [images, setImages] = useState([]);
  const responsiveOptions = [
    {
      breakpoint: "1400px",
      numVisible: 1,
      numScroll: 1,
    },
    {
      breakpoint: "1199px",
      numVisible: 1,
      numScroll: 1,
    },
    {
      breakpoint: "770px",
      numVisible: 1,
      numScroll: 1,
    },
    {
      breakpoint: "575px",
      numVisible: 1,
      numScroll: 1,
    },
  ];

  useEffect(() => {
    setImages(imagesData);
  }, []);

  // const productTemplate = (image: any) => {
  //   console.log(image);

  //   return (
  //     <div className={styles.imageSlide}>
  //       <img src={image?.url} alt={image.name} />
  //     </div>
  //   );
  // };

  const productTemplate = (file: any) => {
    console.log(file);
    const url = file?.url;
    const name = file?.name?.toLowerCase();

    if (
      url &&
      (name.endsWith(".jpg") ||
        name.endsWith(".jpeg") ||
        name.endsWith(".png") ||
        name.endsWith(".gif"))
    ) {
      return (
        <div className={styles.imageSlide}>
          <img src={url} alt={file.name} />
        </div>
      );
    } else if (url && name.endsWith(".pdf")) {
      // Default preview for DOCX or unsupported types
      return (
        <div className={styles.imageSlide}>
          {/* <p style={{ textAlign: "center", color: "#fff" }}>
            <strong>{file.name}</strong> <br />
            <span style={{ fontSize: "12px" }}>
              Preview not available for this file type.
            </span>
          </p> */}
          <PdfViewer pdfUrl={url} />
        </div>
      );
    } else {
      return (
        <div className={styles.imageSlide}>
          <p style={{ textAlign: "center", color: "#fff" }}>Loading...</p>
        </div>
      );
    }
  };

  return (
    <div className={styles.carouselFullscreenWrapper}>
      <button
        className={styles.closeBtn}
        onClick={() => setImagePreview(false)}
      >
        ✖
      </button>

      <Carousel
        value={images}
        numScroll={1}
        numVisible={1}
        responsiveOptions={responsiveOptions}
        itemTemplate={productTemplate}
        page={imageIndex}
        // circular
        // autoplayInterval={400000}
        className={styles.fullscreenCarousel}
      />
    </div>
  );
};

export default PreviewImages;
