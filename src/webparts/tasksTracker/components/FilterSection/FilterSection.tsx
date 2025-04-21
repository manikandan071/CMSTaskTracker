/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import * as React from "react";
import { useEffect, useState } from "react";
import { Dialog } from "primereact/dialog";
import { AutoComplete } from "primereact/autocomplete";
// import { Panel, PanelType } from "@fluentui/react";
import "./style.css";

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
  masterTasksList: taskDetails[];
  setAllTasksList: React.Dispatch<
    React.SetStateAction<taskDetails[] | undefined>
  >;
  setFirst: React.Dispatch<React.SetStateAction<any | undefined>>;
  handleSortByDate: any;
  handleSortByLocation: any;
  isCompleted: boolean;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  masterTasksList,
  setAllTasksList,
  setFirst,
  handleSortByDate,
  handleSortByLocation,
  isCompleted,
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
  ];
  const [searchQueries, setSearchQueries] = useState<any>({
    text: "",
    assignTo: [],
    priority: { name: "", code: "" },
    progress: { name: "", code: "" },
    location: null,
  });

  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [assignedToUsersList, setAssignedToUsersList] = useState<any[]>([]);
  const [locationList, setLocationList] = useState<dropDownOptions[]>([]);
  const [filterAssignedToUsers, setFilterAssignedToUsers] = useState<any[]>([]);

  const serachAndFilterFunction = (value: any, field: string) => {
    console.log("serachAndFilterFunction", value, field);

    let updatedQuery: any;
    if (field === "Clear") {
      updatedQuery = {
        text: "",
        assignTo: [],
        priority: { name: "", code: "" },
        progress: { name: "", code: "" },
        location: null,
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
        ) ||
        item?.AssignedBy?.some((user: any) =>
          user?.text?.toLowerCase().includes(textFilter)
        );
      const matchesLocation =
        !updatedQuery?.location?.text ||
        item?.CemeteryLocation === updatedQuery.location.text;

      const matchesPriority =
        !updatedQuery?.priority?.name ||
        item?.Priority === updatedQuery.priority.name;

      const matchesProgress =
        !updatedQuery.progress.name ||
        item?.Progress === updatedQuery.progress.name;

      const matchesAssignedTo =
        !updatedQuery?.assignTo?.length ||
        item?.AssignedTo?.some((user: any) =>
          updatedQuery?.assignTo.some(
            (selectedUser: any) =>
              selectedUser.secondaryText?.toLowerCase() ===
              user?.secondaryText?.toLowerCase()
          )
        );

      return (
        matchesText &&
        matchesPriority &&
        matchesProgress &&
        matchesLocation &&
        matchesAssignedTo
      );
    });
    setAllTasksList(filtered);
    setFirst(0);
    handleSortByDate(filtered, "none");
    handleSortByLocation(filtered, "none");
  };

  const bindAssignToUsers = () => {
    const allAssignedUsers = masterTasksList.flatMap(
      (task: any) => task.AssignedTo || []
    );

    const uniqueUsers = allAssignedUsers.filter(
      (user, index, self) =>
        index === self.findIndex((u) => u.secondaryText === user.secondaryText)
    );
    setAssignedToUsersList(uniqueUsers);
    console.log(uniqueUsers);
  };
  const bindLocationList = () => {
    const uniqueLocations: any[] = [];
    const seen = new Set();

    masterTasksList.forEach((task: any) => {
      const key = task.CemeteryLocationId;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueLocations.push({
          id: task.CemeteryLocationId,
          key: task.CemeteryLocationId,
          text: task.CemeteryLocation,
          GroupName: task.GroupName,
        });
      }
    });
    setLocationList(uniqueLocations);
  };

  useEffect(() => {
    bindAssignToUsers();
    bindLocationList();
  }, []);

  const search = (event: any) => {
    // Timeout to emulate a network connection
    setTimeout(() => {
      let _filteredusers;

      if (!event.query.trim().length) {
        _filteredusers = [...assignedToUsersList];
      } else {
        _filteredusers = assignedToUsersList.filter((user) => {
          return user.text.toLowerCase().startsWith(event.query.toLowerCase());
        });
      }
      setFilterAssignedToUsers(_filteredusers);
    }, 250);
  };

  return (
    <div style={{ marginBottom: "15px" }}>
      <div className="searchBox">
        <div className="autocomplete-wrapper">
          <AutoComplete
            field="text"
            multiple
            value={searchQueries?.assignTo}
            suggestions={filterAssignedToUsers}
            completeMethod={search}
            onChange={(e) => serachAndFilterFunction(e.value, "assignTo")}
            placeholder="Assigned To"
            className="autocomplete"
          />
        </div>

        <div className="filter-right">
          <div className="filter-row top-row">
            <Dropdown
              value={searchQueries?.location}
              onChange={(e) => serachAndFilterFunction(e.value, "location")}
              options={locationList}
              optionLabel="text"
              placeholder="Location"
              editable
              className="dropdown"
            />

            <Dropdown
              value={searchQueries?.priority}
              onChange={(e) => serachAndFilterFunction(e.value, "priority")}
              options={priorityOptions}
              optionLabel="name"
              placeholder="Priority"
              className="dropdown"
            />
            <Dropdown
              value={searchQueries?.progress}
              onChange={(e) => serachAndFilterFunction(e.value, "progress")}
              options={progressOptions}
              optionLabel="name"
              placeholder="Progress"
              className="dropdown"
              disabled={isCompleted}
            />
            <div className="filter-row bottom-row">
              <InputText
                value={searchQueries?.text}
                type="text"
                className="p-inputtext-sm search-input"
                placeholder="Search"
                onChange={(e) =>
                  serachAndFilterFunction(e.target.value, "text")
                }
              />
              <i
                className="pi pi-refresh refresh-icon"
                style={{
                  fontSize: "1.0rem",
                  color: "#fff",
                  background: "#e05a5a",
                  alignSelf: "center",
                  padding: "7px",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
                title="Clear filter"
                onClick={() => serachAndFilterFunction("", "Clear")}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="filterMobileView">
        <InputText
          style={{ width: "240px" }}
          value={searchQueries?.text}
          type="text"
          placeholder="Search"
          onChange={(e) => serachAndFilterFunction(e.target.value, "text")}
        />
        <i
          className="pi pi-refresh"
          style={{
            fontSize: "1.0rem",
            color: "#fff",
            background: "#e05a5a",
            alignSelf: "center",
            padding: "7px",
            borderRadius: "5px",
            cursor: "pointer",
          }}
          title="Clear filter"
          onClick={() => serachAndFilterFunction("", "Clear")}
        />
        <i
          className="pi pi-bars"
          style={{
            fontSize: "1.0rem",
            color: "#fff",
            background: "#788da9",
            alignSelf: "center",
            padding: "7px",
            borderRadius: "5px",
            cursor: "pointer",
          }}
          onClick={() => setIsFilterPanelOpen(true)}
        />
      </div>
      {/* <Panel
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
            overflowY: "auto", // 👈 important!
            WebkitOverflowScrolling: "touch", // 👈 smoother mobile scroll
          },
        }}
      > */}
      <Dialog
        header="Header"
        visible={isFilterPanelOpen}
        position={"top"}
        style={{ width: "100vw" }}
        onHide={() => {
          if (!isFilterPanelOpen) return;
          setIsFilterPanelOpen(false);
        }}
        draggable={false}
        resizable={false}
        closeOnEscape={true}
        dismissableMask
      >
        <div
          className="filterContent"
          style={{ overflowY: "auto", maxHeight: "100%" }}
        >
          <AutoComplete
            field="text"
            multiple
            value={searchQueries?.assignTo}
            suggestions={filterAssignedToUsers}
            completeMethod={search}
            onChange={(e) => serachAndFilterFunction(e.value, "assignTo")}
            placeholder="Assigned To"
            className="autocomplete"
          />
          <Dropdown
            value={searchQueries?.location}
            onChange={(e) => serachAndFilterFunction(e.value, "location")}
            options={locationList}
            optionLabel="text"
            placeholder="Location"
            // appendTo="self"
            appendTo={document.body}
          />
          <Dropdown
            value={searchQueries?.priority}
            onChange={(e) => serachAndFilterFunction(e.value, "priority")}
            options={priorityOptions}
            optionLabel="name"
            placeholder="Priority"
            // appendTo="self"
            appendTo={document.body}
          />
          <Dropdown
            value={searchQueries?.progress}
            onChange={(e) => serachAndFilterFunction(e.value, "progress")}
            options={progressOptions}
            optionLabel="name"
            placeholder="Progress"
            // appendTo="self"
            appendTo={document.body}
            disabled={isCompleted}
          />
          <div
            style={{ display: "flex", width: "100%", justifyContent: "end" }}
          >
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
            />
          </div>
        </div>
      </Dialog>
      {/* </Panel> */}
    </div>
  );
};

export default FilterSection;
