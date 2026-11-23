import React, { useEffect, useState} from "react";
import "./fetching.css";

const FetchingProducts = () => {

    const [data, setData] = useState([]);
    useEffect(() => {
    fetch("https://dummyjson.com/products")
        .then((res) => {
            return res.json();
        })
        .then((v) => {
            // console.log(v.recipes);
            setData(v.products);
        });
        }, []);

  return data.map((v, i) => (
   <main key={i}>
        {console.log(v)}
        <img src={v.image} alt=""></img>
        <h2>{v.name}</h2>
   </main>
  ));
};

export default FetchingProducts;
