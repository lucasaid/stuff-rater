import React, { useCallback, useEffect, useState } from 'react';
import Range from "./Range"

const App = () => {
  const [total, setTotal] = useState(0)
  const [childhood, setChildhood] = useState(false)
  const [keep, setKeep] = useState(false)
  const [archived, setArchived] = useState(false)
  const [usefulness, setUsefulness] = useState<number>(0)
  const [nostalgic, setNostalgic] = useState(0)
  const [interesting, setInteresting] = useState(0)
  const [joy, setJoy] = useState(0)
  const [rare, setRare] = useState(0)
  const [expensive, setExpensive] = useState(0)

  const keepThresholdTotal = 25
  
  const checkIfHigh = useCallback(() => usefulness >= 7 || nostalgic >= 8 || interesting >= 8 || joy >= 8 || rare >= 9,[interesting, joy, nostalgic, rare, usefulness])
  useEffect(() => {
    let newTotal =  usefulness +
      nostalgic +
      interesting +
      joy +
      rare +
      expensive
    newTotal = childhood ? newTotal + 6 : newTotal
    newTotal = archived ? newTotal - 6 : newTotal
    setTotal(newTotal)
    if(newTotal >= keepThresholdTotal || checkIfHigh()) {
      setKeep(true)
    } else {
      setKeep(false)
    }
  },[usefulness, nostalgic, interesting, childhood, joy, rare, expensive, archived, checkIfHigh])

  const reset = () => {
    setChildhood(false)
    setArchived(false)
    setUsefulness(0)
    setNostalgic(0)
    setInteresting(0)
    setJoy(0)
    setRare(0)
    setExpensive(0)
  }
  return (
    <div style={{marginTop: "10px", padding: "10px"}}>
      <div style={{marginBottom: "15px"}}>
        How useful is the object?
        <Range value={usefulness} setValue={setUsefulness} />
      </div>
      <div style={{marginBottom: "15px"}}>
        How nostalgic is the object?
        <Range value={nostalgic} setValue={setNostalgic} />
      </div>
      <div style={{marginBottom: "15px"}}>
        How interesting is the object?
        <Range value={interesting} setValue={setInteresting} />
      </div>
      <div style={{marginBottom: "15px"}}>
        Does it bring you joy?
        <Range value={joy} setValue={setJoy} />
      </div>
      <div style={{marginBottom: "15px"}}>
        Does it rare?
        <Range value={rare} setValue={setRare} />
      </div>
      <div style={{marginBottom: "15px"}}>
        Does it expensive?
        <Range value={expensive} setValue={setExpensive} />
      </div>
      <div style={{marginBottom: "15px"}}>
        Is it from your childhood? <br/>
        <button style={{padding: "6px 10px", backgroundColor: childhood ? "lightblue" : "transparent"}} onClick={() => setChildhood(true)}>Yes</button>
        <button style={{padding: "6px 10px", backgroundColor: !childhood ? "lightblue" : "transparent"}} onClick={() => setChildhood(false)}>No</button>
      </div>
      <div style={{marginBottom: "15px"}}>
        Can it be archived? <br/>
        <button style={{padding: "6px 10px", backgroundColor: archived ? "lightblue" : "transparent"}} onClick={() => setArchived(true)}>Yes</button>
        <button style={{padding: "6px 10px", backgroundColor: !archived ? "lightblue" : "transparent"}} onClick={() => setArchived(false)}>No</button>
      </div>
      Total: {total} <br /><br />
      <div style={{display:"flex", justifyContent: "space-between", width: "100%"}}>
        <button style={{padding: "6px 10px"}} onClick={reset}>Reset</button>
        {keep ? <span style={{color: "green", fontWeight: "bold", fontSize: "24px"}}>KEEP</span> : <span style={{color: "red", fontWeight: "bold", fontSize: "24px"}}>DON'T KEEP</span>}
      </div>
    </div>
  );
}

export default App;
