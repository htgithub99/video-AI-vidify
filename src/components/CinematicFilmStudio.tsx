import AutoVideoGenerator from "./AutoVideoGenerator";

type CinematicFilmStudioProps = React.ComponentProps<typeof AutoVideoGenerator>;

/** Dedicated entry point for dialogue-led, video-only cinematic production. */
export default function CinematicFilmStudio(props: CinematicFilmStudioProps) {
  return <AutoVideoGenerator {...props} cinematicMode />;
}
