import { MatchArt, Spike, Teleprinter, TopicIcon } from "./art";

const TOPICS = ["AI", "Devices", "Dev & Open Source", "Security", "Business & Startups"];

/**
 * Wide screens only: the reading column stays narrow, and the space around it
 * becomes the wire-room desk the sheet lies on. Pure decoration, hidden from
 * screen readers and from phones.
 */
export default function Desk() {
  return (
    <div className="desk" aria-hidden>
      <div className="desk-side desk-left">
        <div className="desk-item" style={{ top: "7%", left: "10%", width: "78%", rotate: "-3deg" }}>
          <Teleprinter />
        </div>
        <div className="desk-item desk-stamps" style={{ top: "48%", left: "14%", rotate: "-6deg" }}>
          {TOPICS.map((t) => (
            <span key={t} className="desk-stamp">
              <TopicIcon category={t} size={26} />
            </span>
          ))}
        </div>
        <div className="desk-item desk-tape" style={{ bottom: "9%", left: "12%", rotate: "-2deg" }}>
          AI · DEVICES · CODE · SECURITY · STARTUPS
        </div>
      </div>

      <div className="desk-side desk-right">
        <div className="desk-item desk-spike" style={{ top: "6%", right: "24%", rotate: "4deg" }}>
          <Spike count={6} />
        </div>
        <div className="desk-item desk-slip" style={{ top: "38%", right: "10%", width: "72%", rotate: "3deg" }}>
          <MatchArt />
        </div>
        <div className="desk-item desk-note" style={{ bottom: "10%", right: "16%", rotate: "-4deg" }}>
          <span className="desk-pin" />
          <b>5 stories</b>
          <span>2 minutes</span>
          <span>every day</span>
        </div>
      </div>
    </div>
  );
}
