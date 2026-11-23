// import { StrictMode } from 'react'
// import { createRoot } from 'react-dom/client'
// import './index.css'
// import App from './App.jsx'

// createRoot(document.getElementById('root')).render(
//   <StrictMode>
//     <App />
//   </StrictMode>,
// )

// import React from "react";
// import { createElement } from "react";
// import ReactDOM from "react-dom/client";

// console.log(React);
// console.log(ReactDOM);

//  let a=React.createElement("h1",null,"I am learning React")
// let a = React.createElement(
//   "h1",
//   { style: { color: "red", backgroundColor: "green"} },
//   "I am learning React",
// );

// ReactDOM.createRoot(document.getElementById("root")).render(a);

// !-----------JSX way-----------------
// import { createRoot } from "react-dom/client";
// createRoot(document.getElementById("root")).render(
//   <div>
//     <h1>I am JSX in react</h1>
//   </div>
// )

// !--Elements should have only one parent----
// import { createRoot } from "react-dom/client";
// createRoot(document.getElementById("root")).render(
//   <div id="box">
//     <div>I am div</div>
//        <h1> I am h1</h1>
//    </div>
//  )

// import { createRoot } from "react-dom/client";
// import { Fragment } from "react";
// createRoot(document.getElementById("root")).render(
//   <>
//     <div> i am div</div>
//     <h1 className="box">I am h1 and js {2*3}</h1>
//     <label htmlFor=""></label>
//     <img src="" alt="" />
//     <h1></h1>
//   </>
// )



//! --------------Entry point-----------------

import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <App />
)