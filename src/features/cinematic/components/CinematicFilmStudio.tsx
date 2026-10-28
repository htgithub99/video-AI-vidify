import CinematicFilmSetupSection from "./CinematicFilmSetupSection.js";
import AutoVideoGenerator from "../../video-generation/components/AutoVideoGenerator";
type CinematicFilmStudioProps = React.ComponentProps<typeof AutoVideoGenerator>;
export default function CinematicFilmStudio(props: CinematicFilmStudioProps) {
  return <AutoVideoGenerator {...props} cinematicMode CinematicSetupSection={CinematicFilmSetupSection} />;
}
