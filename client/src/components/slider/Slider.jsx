import { useState } from "react";
import "./slider.scss";

function Slider({ images }) {
  const [imageIndex, setImageIndex] = useState(null);

  const changeSlide = (direction) => {
    if (direction === "left") {
      setImageIndex((imageIndex - 1 + images.length) % images.length);
    } else {
      setImageIndex((imageIndex + 1) % images.length);
    }
  };

  const isLessThanOrEqualToFourImages = images.length <= 4; // Check if there are 4 or fewer images

  return (
    <div className="slider">
      {imageIndex !== null && (
        <div className="fullSlider">
          <div className="arrow" onClick={() => changeSlide("left")}>
            <img src="/arrow.png" alt="Left arrow" />
          </div>
          <div className="imgContainer">
            <img src={images[imageIndex]} alt="" />
          </div>
          <div className="arrow" onClick={() => changeSlide("right")}>
            <img src="/arrow.png" className="right" alt="Right arrow" />
          </div>
          <div className="close" onClick={() => setImageIndex(null)}>
            X
          </div>
        </div>
      )}

      {images.length === 0 ? (
        <img src="/Image_not_available.png" alt="No Image Available" />
      ) : images.length === 1 ? ( // Check if there is only one image
        <div className="singleImage">
          <img src={images[0]} alt="" onClick={() => setImageIndex(0)} />
        </div>
      ) : (
        <>
          <div className="bigImage">
            <img src={images[0]} alt="" onClick={() => setImageIndex(0)} />
          </div>
          <div className="smallImages">
            {images.length === 3 ? (
              <div className="twoImage">
                {images.slice(1, 3).map((image, index) => (
                  <img
                    src={image}
                    alt=""
                    key={index}
                    onClick={() => setImageIndex(index + 1)}
                  />
                ))}
              </div>
            ) : isLessThanOrEqualToFourImages ? (
              images
                .slice(1)
                .map((image, index) => (
                  <img
                    src={image}
                    alt=""
                    key={index}
                    onClick={() => setImageIndex(index + 1)}
                  />
                ))
            ) : (
              images
                .slice(1, 3)
                .map((image, index) => (
                  <img
                    src={image}
                    alt=""
                    key={index}
                    onClick={() => setImageIndex(index + 1)}
                  />
                ))
            )}
            {images.length > 4 && (
              <div className="remaining-count" onClick={() => setImageIndex(3)}>
                <div className="blurred-image">
                  <img src={images[3]} alt="" />
                </div>
                <span>+{images.length - 4}</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Slider;
