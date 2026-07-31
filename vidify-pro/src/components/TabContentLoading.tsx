import _ from "lodash";
import {
  TAB_CONTENT_LOADING_CLASSES,
  TAB_CONTENT_LOADING_CONFIG,
} from "../constants";

export default function TabContentLoading() {
  const classes = TAB_CONTENT_LOADING_CLASSES;

  return (
    <div aria-busy className={classes.ROOT}>
      <div className={classes.GRID}>
        <div className={classes.MAIN_COLUMN}>
          <div className={classes.MAIN_CARD}>
            <div className={classes.MAIN_TITLE} />
            <div className={classes.MAIN_OPTIONS}>
              <div className={classes.MAIN_OPTION_PRIMARY} />
              <div className={classes.MAIN_OPTION_SECONDARY} />
            </div>
            <div className={classes.MAIN_BODY} />
          </div>

          <div className={classes.FOOTER_CARD}>
            <div className={classes.FOOTER_TITLE} />
            <div className={classes.FOOTER_GRID}>
              {_.map(TAB_CONTENT_LOADING_CONFIG.ROWS, (row) => (
                <div key={row} className={classes.FOOTER_ITEM} />
              ))}
            </div>
          </div>
        </div>

        <div className={classes.SIDE_COLUMN}>
          <div className={classes.SIDE_HEADER_CARD}>
            <div className={classes.SIDE_HEADER_TITLE} />
            <div className={classes.SIDE_HEADER_BODY} />
          </div>

          <div className={classes.SIDE_BODY_CARD}>
            <div className={classes.SIDE_BODY_TITLE} />
            <div className={classes.SIDE_BODY_GRID}>
              {_.map(TAB_CONTENT_LOADING_CONFIG.ROWS, (row) => (
                <div key={row} className={classes.SIDE_BODY_ROW}>
                  <div className={classes.SIDE_BODY_LABEL} />
                  <div className={classes.SIDE_BODY_VALUE} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
