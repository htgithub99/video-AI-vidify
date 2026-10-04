import AutoVideoGenerator from "./AutoVideoGenerator";
type CinematicFilmStudioProps = React.ComponentProps<typeof AutoVideoGenerator>;
export default function CinematicFilmStudio(props: CinematicFilmStudioProps) {
  return <AutoVideoGenerator {...props} cinematicMode />;
}
