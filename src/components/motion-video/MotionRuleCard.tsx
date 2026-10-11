import type { LucideIcon } from "lucide-react";
import type { FC } from "react";
import * as MR from "../../constants/motionRuntime.js";
export const MotionRuleCard: FC<{ items?: string[]; label: string; icon: LucideIcon; styles: { card: string; heading: string; list: string; bullet: string } }> = ({ items, label, icon: Icon, styles }) =>
  items?.length ? (
    <div className={styles.card}>
      <div className={styles.heading}>
        <Icon className={MR.MOTION_TEXT_H_4_W_4} />
        <span>{label}</span>
      </div>
      <ul className={styles.list}>
        {items.map((item, index) => (
          <li key={index} className={MR.MOTION_TEXT_FLEX_ITEMS_START_GAP_1_5}>
            <span className={styles.bullet}>{MR.MOTION_TEXT_SYMBOL_32}</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  ) : null;
