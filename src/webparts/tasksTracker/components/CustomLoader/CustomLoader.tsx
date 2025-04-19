/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import * as React from "react";
import "./CustomLoader.css";

const CustomLoader: React.FC<any> = () => {
  return (
    <div className="loader">
      <div className="dot dot1"></div>
      <div className="dot dot2"></div>
      <div className="dot dot3"></div>
      <div className="dot dot4"></div>
      <div className="dot dot5"></div>
      <div className="dot dot6"></div>
    </div>
  );
};

export default CustomLoader;
