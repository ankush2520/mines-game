import Image from "next/image";
import GridCreator from "./components/GridCreator";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center overflow-hidden" style={{ backgroundColor: '#0B1020' }}>
      <GridCreator rows={5} cols={5} />
    </div>
  );
}
