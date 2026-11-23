// import React from 'react'

// const Child1 = (props) => {
//     console.log(props);
    
//   return (
//     <div>
//         <h1>Name:{props.data}</h1>
//         <h1>Name:{props.val}</h1>
//     </div>
//   )
// }

// export default Child1

import React from 'react'

const Child1 = ({data}) => {
    const {skills}=data;

  return (
    // <div>
    //   Name: {name}<br/>
    //   Age: {age}<br/>
    //   Skills: {skills}
    // </div>
    
    skills.map((v,i)=>(
        <h1 key={i}>{v}</h1>
    ))
  )
}

export default Child1
