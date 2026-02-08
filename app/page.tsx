import Image from "next/image";
import GridCreator from "./components/GridCreator";

export default function Home() {
  return (
    <div>
      <GridCreator rows={5} cols={5} />
    </div>
  );
}
