import Image from "next/image";
import GridCreator from "./components/GridCreator";

export default function Home() {
  return (
    <div>
      <h1 style={{ textAlign: "center" }}>Mines-Game</h1>
      <GridCreator rows={5} cols={5} />
    </div>
  );
}
