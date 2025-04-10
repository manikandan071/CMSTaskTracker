/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-floating-promises */
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import * as React from "react";
import { useState } from "react";
import { Panel, PanelType } from "@fluentui/react";

interface taskDetails {
  Title: string;
  Description: string;
  Priority: string;
  Progress: any;
  StartDate: any;
  DueDate: any;
  Id: number;
  AssignedTo: any[];
  CemeteryLocationId?: number;
  CemeteryLocation?: string;
  GroupName?: string;
  Notes?: string;
  recOwner?: boolean;
}
interface dropDownOptions {
  Id?: number;
  key: string;
  text: string;
  GroupName?: string;
}

interface FilterSectionProps {
  userCemeteryList: dropDownOptions[];
  masterTasksList: taskDetails[];
  setAllTasksList: React.Dispatch<
    React.SetStateAction<taskDetails[] | undefined>
  >;
  setFirst: React.Dispatch<React.SetStateAction<any | undefined>>;
  handleSortByDate: any;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  userCemeteryList,
  masterTasksList,
  setAllTasksList,
  setFirst,
  handleSortByDate,
}) => {
  const priorityOptions = [
    { name: "None", code: "None" },
    { name: "Critical", code: "Critical" },
    { name: "High", code: "High" },
    { name: "Medium", code: "Medium" },
    { name: "Low", code: "Low" },
  ];
  const progressOptions = [
    { name: "None", code: "None" },
    { name: "Not started", code: "Not started" },
    { name: "In progress", code: "In progress" },
    { name: "Completed", code: "Completed" },
  ];
  const [searchQueries, setSearchQueries] = useState<any>({
    text: "",
    priority: { name: "", code: "" },
    progress: { name: "", code: "" },
    location: {
      Id: "",
      key: "",
      text: "",
      GroupName: "",
    },
  });

  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  const serachQueryFunction = (value: any, field: string) => {
    console.log("value", value);
    let updatedQuery: any;
    if (field === "Clear") {
      updatedQuery = {
        text: "",
        priority: { name: "", code: "" },
        progress: { name: "", code: "" },
        location: {
          Id: "",
          key: "",
          text: "",
          GroupName: "",
        },
      };
    } else {
      updatedQuery = {
        ...searchQueries,
        [field]: value?.name === "None" ? { name: "", code: "" } : value,
      };
    }

    setSearchQueries(updatedQuery);

    const filtered = (masterTasksList || []).filter((item: any) => {
      const textFilter = updatedQuery.text?.toLowerCase() || "";

      const matchesText =
        !textFilter ||
        item?.Title?.toLowerCase().includes(textFilter) ||
        item?.Description?.toLowerCase().includes(textFilter) ||
        item?.CemeteryLocation?.toLowerCase().includes(textFilter) ||
        item?.AssignedTo?.some((user: any) =>
          user?.text?.toLowerCase().includes(textFilter)
        );
      const matchesLocation =
        !updatedQuery.location.text ||
        item?.CemeteryLocation === updatedQuery.location.text;

      const matchesPriority =
        !updatedQuery.priority.name ||
        item?.Priority === updatedQuery.priority.name;

      const matchesProgress =
        !updatedQuery.progress.name ||
        item?.Progress === updatedQuery.progress.name;

      return (
        matchesText && matchesPriority && matchesProgress && matchesLocation
      );
    });
    setAllTasksList(filtered);
    setFirst(0);
    handleSortByDate(filtered, "none");
  };
  return (
    <div>
      <div className="searchBox">
        <Dropdown
          value={searchQueries?.location}
          onChange={(e) => serachQueryFunction(e.value, "location")}
          options={userCemeteryList}
          optionLabel="text"
          placeholder="Location"
          // className="w-full md:w-14rem"
        />
        <Dropdown
          value={searchQueries?.priority}
          onChange={(e) => serachQueryFunction(e.value, "priority")}
          options={priorityOptions}
          optionLabel="name"
          placeholder="Priority"
          // className="w-full md:w-14rem"
        />
        <Dropdown
          value={searchQueries?.progress}
          onChange={(e) => serachQueryFunction(e.value, "progress")}
          options={progressOptions}
          optionLabel="name"
          placeholder="Progress"
          // className="w-full md:w-14rem"
        />
        <InputText
          value={searchQueries?.text}
          type="text"
          className="p-inputtext-sm"
          placeholder="Search"
          onChange={(e) => serachQueryFunction(e.target.value, "text")}
        />
        <i
          className="pi pi-refresh"
          style={{
            fontSize: "1.2rem",
            color: "#fff",
            background: "#788da9",
            alignSelf: "center",
            padding: "7px",
            borderRadius: "5px",
            cursor: "pointer",
          }}
          onClick={() => serachQueryFunction("", "Clear")}
        ></i>
      </div>
      <div className="filterMobileView">
        <i
          className="pi pi-bars"
          style={{
            fontSize: "1.2rem",
            color: "#fff",
            background: "#788da9",
            alignSelf: "center",
            padding: "7px",
            borderRadius: "5px",
            cursor: "pointer",
          }}
          onClick={() => setIsFilterPanelOpen(true)}
        ></i>
      </div>
      <Panel
        isOpen={isFilterPanelOpen}
        onDismiss={() => setIsFilterPanelOpen(false)}
        isLightDismiss
        isBlocking={false}
        hasCloseButton={false}
        type={PanelType.custom}
        className="mobileTopFilterPanel"
        styles={{
          main: {
            top: 0,
            left: 0,
            width: "100vw",
            height: "37vh",
            maxWidth: "100vw",
            backgroundColor: "#fff",
            borderRadius: "0",
          },
        }}
      >
        <div className="filterContent">
          <Dropdown
            value={searchQueries?.location}
            onChange={(e) => serachQueryFunction(e.value, "location")}
            options={userCemeteryList}
            optionLabel="text"
            placeholder="Location"
            appendTo="self"
          />
          <Dropdown
            value={searchQueries?.priority}
            onChange={(e) => serachQueryFunction(e.value, "priority")}
            options={priorityOptions}
            optionLabel="name"
            placeholder="Priority"
            appendTo="self"
          />
          <Dropdown
            value={searchQueries?.progress}
            onChange={(e) => serachQueryFunction(e.value, "progress")}
            options={progressOptions}
            optionLabel="name"
            placeholder="Progress"
            appendTo="self"
          />
          <InputText
            value={searchQueries?.text}
            type="text"
            placeholder="Search"
            onChange={(e) => serachQueryFunction(e.target.value, "text")}
          />
          <i
            className="pi pi-refresh"
            style={{
              fontSize: "1.2rem",
              color: "#fff",
              background: "#788da9",
              alignSelf: "center",
              padding: "7px",
              borderRadius: "5px",
              cursor: "pointer",
              marginTop: "10px",
            }}
            onClick={() => serachQueryFunction("", "Clear")}
          ></i>
          <i
            className="pi pi-times"
            style={{
              fontSize: "1.2rem",
              alignSelf: "center",
              padding: "7px",
              cursor: "pointer",
              marginTop: "10px",
              color: "#788da9",
            }}
            onClick={() => setIsFilterPanelOpen(false)}
          ></i>
        </div>
      </Panel>
    </div>
  );
};

export default FilterSection;
