import React, {
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";

import {
  AllCommunityModule,
  ClientSideRowModelModule,
  type ColDef,
  type GetRowIdFunc,
  type GetRowIdParams,
  ModuleRegistry,
  type ValueFormatterFunc,
  type ValueGetterParams,
} from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import {
  AdvancedFilterModule,
  CellSelectionModule,
  ColumnMenuModule,
  ColumnsToolPanelModule,
  ContextMenuModule,
  ExcelExportModule,
  FiltersToolPanelModule,
  IntegratedChartsModule,
  RichSelectModule,
  RowGroupingModule,
  RowGroupingPanelModule,
  SetFilterModule,
  SparklinesModule,
  StatusBarModule,
} from "ag-grid-enterprise";
import { AgGridReact } from "ag-grid-react";

import styles from "./FinanceExample.module.css";
import { TickerCellRenderer } from "./renderers/TickerCellRenderer";
import { sparklineTooltipRenderer } from "./renderers/sparklineTooltipRenderer";
import { AgChartsEnterpriseModule } from "ag-charts-enterprise";
import { usePortfolio } from "../api/tradingapi/api";

export interface Props {
  gridTheme?: string;
  isDarkMode?: boolean;
  gridHeight?: number | null;
  playerId: string;
  currentTime: number;
}

ModuleRegistry.registerModules([
  AllCommunityModule,
  ClientSideRowModelModule,
  AdvancedFilterModule,
  ColumnsToolPanelModule,
  ExcelExportModule,
  FiltersToolPanelModule,
  ColumnMenuModule,
  ContextMenuModule,
  CellSelectionModule,
  RowGroupingModule,
  RowGroupingPanelModule,
  SetFilterModule,
  RichSelectModule,
  StatusBarModule,
  SparklinesModule.with(AgChartsEnterpriseModule)
]);

const numberFormatter: ValueFormatterFunc = ({ value }) => {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "decimal",
    maximumFractionDigits: 2,
  });
  return value == null ? "" : formatter.format(value);
};

export const FinanceExample: React.FC<Props> = ({
  gridTheme = "ag-theme-quartz",
  isDarkMode = false,
  gridHeight = null,
  playerId,
  currentTime,
}) => {
  const { rowData } = usePortfolio("player_002");
  const gridRef = useRef<AgGridReact>(null);
  const previousRowDataRef = useRef<any[]>([]);

  // Use transactions to update data smoothly instead of replacing all rows
  useEffect(() => {
    if (!gridRef.current || !rowData) return;

    const api = gridRef.current.api;
    if (!api) return;

    // On first load, set the data normally
    if (previousRowDataRef.current.length === 0) {
      previousRowDataRef.current = rowData;
      return;
    }

    // For updates, use transactions
    const updates = rowData.filter(newRow => {
      const oldRow = previousRowDataRef.current.find(r => r.ticker === newRow.ticker);
      if (!oldRow) return false;
      
      // Check if any values changed
      return (
        oldRow.price !== newRow.price ||
        oldRow.quantity !== newRow.quantity ||
        JSON.stringify(oldRow.timeline) !== JSON.stringify(newRow.timeline)
      );
    });

    const adds = rowData.filter(newRow => 
      !previousRowDataRef.current.find(r => r.ticker === newRow.ticker)
    );

    const removes = previousRowDataRef.current.filter(oldRow =>
      !rowData.find(r => r.ticker === oldRow.ticker)
    );

    if (updates.length > 0 || adds.length > 0 || removes.length > 0) {
      api.applyTransaction({
        update: updates,
        add: adds,
        remove: removes,
      });
    }

    previousRowDataRef.current = rowData;
  }, [rowData]);

  const colDefs = useMemo<ColDef[]>(() => {
    return [
      {
        field: "ticker",
        cellRenderer: TickerCellRenderer,
      },
      {
        headerName: "Timeline",
        field: "timeline",
        sortable: false,
        filter: false,
        cellRenderer: "agSparklineCellRenderer",
        cellRendererParams: {
          sparklineOptions: {
            type: "bar",
            direction: "vertical",
            axis: {
              strokeWidth: 0,
            },
            tooltip: {
              renderer: sparklineTooltipRenderer,
            },
          },
        },
      },
      {
        field: "instrument",
        cellDataType: "text",
        type: "rightAligned",
        minWidth: 100,
        initialWidth: 100,
      },
      {
        colId: "p&l",
        headerName: "P&L",
        cellDataType: "number",
        filter: "agNumberColumnFilter",
        type: "rightAligned",
        cellRenderer: "agAnimateShowChangeCellRenderer",
        valueGetter: ({ data }: ValueGetterParams) =>
          data && data.quantity * (data.price - data.purchasePrice),
        valueFormatter: numberFormatter,
        aggFunc: "sum",
        minWidth: 140,
        initialWidth: 140,
      },
      {
        colId: "totalValue",
        headerName: "Total Value",
        type: "rightAligned",
        cellDataType: "number",
        filter: "agNumberColumnFilter",
        valueGetter: ({ data }: ValueGetterParams) =>
          data && data.quantity * data.price,
        cellRenderer: "agAnimateShowChangeCellRenderer",
        valueFormatter: numberFormatter,
        aggFunc: "sum",
        minWidth: 160,
        initialWidth: 160,
      },
    ];
  }, []);

  const defaultColDef: ColDef = useMemo(
    () => ({
      flex: 1,
      filter: true,
      enableRowGroup: true,
      enableValue: true,
      enableCellChangeFlash: true, // Enable cell flash animation on value change
    }),
    []
  );

  const getRowId = useCallback<GetRowIdFunc>(
    ({ data: { ticker } }: GetRowIdParams) => ticker,
    []
  );

  const statusBar = useMemo(
    () => ({
      statusPanels: [
        { statusPanel: "agTotalAndFilteredRowCountComponent" },
        { statusPanel: "agTotalRowCountComponent" },
        { statusPanel: "agFilteredRowCountComponent" },
        { statusPanel: "agSelectedRowCountComponent" },
        { statusPanel: "agAggregationComponent" },
      ],
    }),
    []
  );

  const themeClass = `${gridTheme}${isDarkMode ? "-dark" : ""}`;
  const chartThemes = isDarkMode ? ["ag-default-dark"] : ["ag-default"];

  if (!rowData) {
    return <div className={styles.loading}>Loading portfolio...</div>;
  }

  return (
    <div
      style={{ height: '100%' }}
      className={`${themeClass} ${styles.grid}`}
    >
      <AgGridReact
        theme="legacy"
        chartThemes={chartThemes}
        ref={gridRef}
        getRowId={getRowId}
        rowData={previousRowDataRef.current.length === 0 ? rowData : undefined}
        columnDefs={colDefs}
        defaultColDef={defaultColDef}
        cellSelection={true}
        enableCharts
        rowGroupPanelShow="always"
        suppressAggFuncInHeader
        groupDefaultExpanded={-1}
        statusBar={statusBar}
        animateRows={true}
      />
    </div>
  );
};