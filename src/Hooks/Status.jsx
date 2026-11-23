// import React, { useState } from "react";

// const Status = () => {
//     const [state, setState] = useState("pending");

//     return (
//         <>
//           <h1>Status:{state}</h1>
//           <button onClick={() => setState("Approved")}>Approve</button>
//         </>
//     );
// };

// export default Status;


// import React, { useState } from "react";
// const Status = () => {
//     const [state, setState] = useState("Pending");

//     function update(){
//         setState("Approved")
//     }
//  return (
//     <>
//       <h1>Status:{state}</h1>
//       <button onClick={update}>Approve</button>
//     </>
//  );
// };
// export default Status;

// import React, { useState } from "react";

// const Status = () => {
//     const [count, setCount] = useState(0);
//     function increament() {
//         setCount(count + 1);
//     }
//     function decrement() {
//         setCount(count - 1);
//     }
//     function reset() {
//         setCount(0);
//     }

//     return (
//         <>
//           <h1>Count:{count}</h1>
//           <button onClick={increament}>Increament</button>
//           <button onClick={decrement}>Decrement</button>
//           <button onClick={reset}>Reset</button>
//         </>
//     );
// };

// export default Status

import React, { useState } from "react";
const Status = () => {
    const [data,setData] = useState({name:"Anish",age:27})
    return (
        <>
         <h2>Name:{data.name}</h2>
         <h2>Age:{data.age}</h2>
         <button onClick={()=>setData({...data,name:"Anish Ravi"})}>Full Name</button>
         <button onClick={()=>setData({...data,age:28})}>Age +1</button>
        </>
    )
}

export default Status