// import React from 'react'
// import Child1 from './Child1'

// const Parent = () => {
//   return (
//     <div>
//       <Child1 data="Shubham" val="nitish"></Child1>
//     </div>
//   )
// }

// export default Parent


//import React from 'react'
import Child1 from './Child1'

const Parent = () => {

    let emp={
        name:"Anish",
        age:27,
        skills:["html","css","js"]
    }
  return (
    <Child1 data={emp}/>
  )
}

export default Parent
