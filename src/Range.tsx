import React from 'react';

interface Props {
  value: number
  setValue: (value: number) => void
}
const Range = ({value, setValue }: Props) => {
  const loopRanges = () => {
    return [...Array(11)].map((_, i) => {
      return <button onClick={() => setValue(i)} style={{padding: "6px 8px", backgroundColor: value === i ? "lightblue" : "transparent"}}>{i}</button>
    })
  }
  return (
    <div style={{display: "flex", width: "300px", justifyContent: "space-between"}}>
      {loopRanges()}
    </div>
  );
}

export default Range;
