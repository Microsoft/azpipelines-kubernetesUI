/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { BaseComponent } from "@uifabric/utilities";
import * as Util_String from "azure-devops-ui/Core/Util/String";
import * as React from "react";
import { KubeSummary } from "../Common/KubeSummary";
import * as Resources from "../Resources";
import { PodContentReader } from "./PodContentReader";
import { IPodRightPanelProps } from "./PodsRightPanel";

export interface IPodLogProps extends IPodRightPanelProps { }

interface IPodLogState {
    logContent: string;
    uid: string;
}

export class PodLog extends BaseComponent<IPodLogProps, IPodLogState> {
    constructor(props: IPodLogProps) {
        super(props, {});
        this.state = { logContent: Resources.LoadingText, uid: this.props.pod.metadata.uid };
    }

    public render(): JSX.Element {
        return (
            <PodContentReader
                key={this.state.uid}
                className="pod-log"
                contentClassName="pod-log-content"
                options={{
                    theme: "vs-dark",
                    language: "text/plain"
                }}
                text={this.state.logContent || ""}
            />
        );
    }

    public componentDidMount(): void {
        const service = KubeSummary.getKubeService();
        service && service.getPodLog && service.getPodLog(this.props.pod.metadata.name).then(logContent => {
            this.setState({
                uid: Util_String.newGuid(), // required to refresh the content
                logContent: logContent || ""
            });
        }).catch(error => {
            let errorMessage = error || "";
            errorMessage = (typeof errorMessage == "string") ? errorMessage : JSON.stringify(errorMessage);
            this.setState({
                uid: Util_String.newGuid(), // required to refresh the content
                logContent: errorMessage
            });
        });
    }
}