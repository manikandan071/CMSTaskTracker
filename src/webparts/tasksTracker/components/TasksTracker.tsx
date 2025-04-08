import * as React from "react";
// import styles from './TasksTracker.module.scss';
import type { ITasksTrackerProps } from "./ITasksTrackerProps";
import { sp } from "@pnp/sp/presets/all";
import { graph } from "@pnp/graph/presets/all";
import MainComponent from "./MainComponent";
import "../../../External/style.css";

export default class TasksTracker extends React.Component<
  ITasksTrackerProps,
  {}
> {
  constructor(prop: ITasksTrackerProps) {
    super(prop);
    sp.setup({
      spfxContext: this.props.context as unknown as undefined,
    });
    graph.setup({
      spfxContext: this.props.context as unknown as undefined,
    });
  }
  public render(): React.ReactElement<ITasksTrackerProps> {
    return (
      <div style={{ width: "100%" }}>
        <MainComponent SpContext={this.props.context} graphContext={graph} />
      </div>
    );
  }
}
