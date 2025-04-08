import React, { useState, useEffect } from "react";
import { Carousel } from "primereact/carousel";
import styles from "./PreViewImages.module.scss";

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
      numVisible: 2,
      numScroll: 1,
    },
    {
      breakpoint: "1199px",
      numVisible: 3,
      numScroll: 1,
    },
    {
      breakpoint: "767px",
      numVisible: 2,
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

  const productTemplate = (image: any) => {
    return (
      <div className={styles.imageSlide}>
        <img src={image?.url} alt={image.name} />
      </div>
    );
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
        circular
        autoplayInterval={4000}
        className={styles.fullscreenCarousel}
      />
    </div>
  );
};

export default PreviewImages;
