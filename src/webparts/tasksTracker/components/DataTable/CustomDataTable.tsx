import * as React from "react";
import useScreenSize from "./ScreenSize";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import {
  DueDateBodyTemplate,
  LocationBodyTemplate,
  PriorityBodyTemplate,
  ProgressBodyTemplate,
  UsersBodyTemplate,
} from "../CustomComponents/CustomComponents";
import "./CustomDataTable.css";

interface taskDetails {
  Title: string;
  Description: string;
  Priority: string;
  Progress: any;
  StartDate: any;
  DueDate: any;
  Id: number;
  AssignedTo: any[];
  AssignedBy: any[];
  CemeteryLocationId?: number;
  CemeteryLocation?: string;
  GroupName?: string;
  Notes?: string;
  recOwner?: boolean;
  isAttachment?: boolean;
}
interface IDataTableProps {
  data: taskDetails[];
  cemeteryListwithBg: any[];
}

const CustomDataTable: React.FC<IDataTableProps> = ({
  data,
  cemeteryListwithBg,
}) => {
  const screenWidth = useScreenSize();
  const isTablet = screenWidth;

  return (
    <DataTable
      width="100%"
      value={data}
      scrollable
      scrollHeight="60vh"
      // responsiveLayout="scroll"
      className="p-datatable-sm"
      paginator
      rows={10}
      paginatorTemplate="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
      currentPageReportTemplate="Showing {first} to {last} of {totalRecords} projects"
      emptyMessage="No data found."
    >
      <Column
        field="Title"
        header="Title"
        style={{ width: isTablet ? "20%" : "20%" }}
      />
      <Column
        field="CemeteryLocation"
        header="Cemetery location"
        body={(rowData) => (
          <LocationBodyTemplate
            location={rowData?.CemeteryLocation}
            cemeteryListwithBg={cemeteryListwithBg}
          />
        )}
        style={{
          width: isTablet ? "20%" : "15%",
          maxWidth: "15%",
          overflow: "hidden",
        }}
      />
      {!isTablet && (
        <Column
          field="AssignedBy"
          header="Assigned by"
          body={(rowData) => <UsersBodyTemplate users={rowData?.AssignedBy} />}
          style={{ width: "10%" }}
        />
      )}
      <Column
        field="AssignTo"
        header="Assign to"
        body={(rowData) => <UsersBodyTemplate users={rowData?.AssignedTo} />}
        style={{ width: isTablet ? "15%" : "15%" }}
      />
      <Column
        field="Priority"
        header="Priority"
        body={(rowData) => <PriorityBodyTemplate rowData={rowData} />}
        style={{ width: isTablet ? "10%" : "10%" }}
      />
      <Column
        field="Progress"
        header="Progress"
        body={(rowData) => <ProgressBodyTemplate rowData={rowData} />}
        style={{ width: isTablet ? "10%" : "10%" }}
      />
      <Column
        field="DueDate"
        header="Due date"
        body={(rowData) => <DueDateBodyTemplate rowData={rowData} />}
        style={{ width: isTablet ? "10%" : "10%" }}
      />
      <Column
        field="Id"
        header="Action"
        style={{ width: isTablet ? "10%" : "10%" }}
      />
    </DataTable>
  );
};

export default CustomDataTable;
