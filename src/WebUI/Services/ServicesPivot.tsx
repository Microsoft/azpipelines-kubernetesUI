/*
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the MIT license.
*/

import { V1ServiceList } from "@kubernetes/client-node";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { Spinner, SpinnerSize } from "azure-devops-ui/Spinner";
import { css } from "azure-devops-ui/Util";
import { Filter, IFilterItemState, IFilterState } from "azure-devops-ui/Utilities/Filter";
import * as React from "react";
import * as Resources from "../../Resources";
import { NameKey, TypeKey } from "../Common/KubeFilterBar";
import { KubeZeroData } from "../Common/KubeZeroData";
import { Scenarios, ServicesEvents } from "../Constants";
import { ActionsCreatorManager } from "../FluxCommon/ActionsCreatorManager";
import { StoreManager } from "../FluxCommon/StoreManager";
import { getTelemetryService, KubeFactory } from "../KubeFactory";
import { ServicesTable } from "../Services/ServicesTable";
import { IVssComponentProperties } from "../Types";
import { ServicesActionsCreator } from "./ServicesActionsCreator";
import { ServicesFilterBar } from "./ServicesFilterBar";
import "./ServicesPivot.scss";
import { ServicesStore } from "./ServicesStore";

export interface IServicesPivotState {
    serviceList?: V1ServiceList;
    isLoading?: boolean;
}

export interface IServicesPivotProps extends IVssComponentProperties {
    filter: Filter;
    namespace?: string;
    filterToggled: ObservableValue<boolean>;
}

export class ServicesPivot extends React.Component<IServicesPivotProps, IServicesPivotState> {
    constructor(props: IServicesPivotProps) {
        super(props, {});

        getTelemetryService().scenarioStart(Scenarios.Services);

        this._actionCreator = ActionsCreatorManager.GetActionCreator<ServicesActionsCreator>(ServicesActionsCreator);
        this._store = StoreManager.GetStore<ServicesStore>(ServicesStore);

        const storeState = this._store.getState();
        this.state = {
            serviceList: storeState.serviceList,
            isLoading: storeState.isLoading
        };

        this._actionCreator.getServices(KubeFactory.getKubeService());
        this._store.addListener(ServicesEvents.ServicesFetchedEvent, this._onServicesFetched);
    }

    public render(): React.ReactNode {
        if (this.state.isLoading) {
            return <Spinner className={"flex flex-grow loading-services"} size={SpinnerSize.large} label={Resources.LoadingServicesSpinnerLabel} />;
        }

        return (
            <>
                {this._getFilterBar()}
                <div className={css("services-pivot-data", "k8s-pivot-data")}>
                    {this._getContent()}
                </div>
            </>
        );
    }

    public componentWillUnmount(): void {
        this._store.removeListener(ServicesEvents.ServicesFetchedEvent, this._onServicesFetched);
    }

    private _onServicesFetched = (): void => {
        const storeState = this._store.getState();
        this.setState({
            serviceList: storeState.serviceList,
            isLoading: storeState.isLoading
        });
    }

    private _getContent(): JSX.Element {
        const serviceSize: number = this.state.serviceList && this.state.serviceList.items ? this.state.serviceList.items.length : 0;
        return (serviceSize === 0 ? this._getZeroData() :
            <ServicesTable
                serviceList={this.state.serviceList || {} as V1ServiceList}
                nameFilter={this._getNameFilterValue()}
                typeSelections={this._getTypeFilterValue()}
                markTTICallback={this._markTTI}
            />);
    }

    private _getFilterBar(): JSX.Element {
        return (<ServicesFilterBar
            className={css("services-pivot-filter", "k8s-pivot-filter")}
            serviceList={this.state.serviceList || {} as V1ServiceList}
            filter={this.props.filter}
            filterToggled={this.props.filterToggled}
        />);
    }

    private _getNameFilterValue(): string | undefined {
        const filterState: IFilterState | undefined = this.props.filter.getState();
        const filterItem: IFilterItemState | null = filterState ? filterState[NameKey] : null;
        return filterItem ? (filterItem.value as string) : undefined;
    }

    private _getTypeFilterValue(): any[] {
        const filterState: IFilterState | undefined = this.props.filter.getState();
        const filterItem: IFilterItemState | null = filterState ? filterState[TypeKey] : null;
        const selections: any[] = filterItem ? filterItem.value : [];
        return selections;
    }

    private _getZeroData(): JSX.Element {
        setTimeout(this._markTTI, 0);
        return KubeZeroData.getServicesZeroData();
    }

    private _markTTI = () => {
        if (!this._isTTIMarked) {
            getTelemetryService().scenarioEnd(Scenarios.Services);
        }
        this._isTTIMarked = true;
    }

    private _isTTIMarked: boolean = false;
    private _store: ServicesStore;
    private _actionCreator: ServicesActionsCreator;
}