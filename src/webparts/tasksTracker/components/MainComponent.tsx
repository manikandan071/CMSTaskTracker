/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-floating-promises */
import * as React from "react";
import { useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Paginator } from "primereact/paginator";

// import { sp } from "@pnp/sp";
import { Web } from "@pnp/sp/webs";
// import { graph } from "@pnp/graph/presets/all";

import styles from "./TasksTracker.module.scss";
import "./style.css";
import "@pnp/graph/groups";
import TaskForm from "./taskForm/TaskForm";
import { InputText } from "primereact/inputtext";

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
}
interface dropDownOptions {
  Id?: number;
  key: string;
  text: string;
  GroupName?: string;
}

interface formDataDetails {
  Title?: string;
  Description?: string;
  Notes?: string;
  CemeteryLocationId?: number;
  CemeteryLocation?: any;
  GroupName?: string;
  Priority?: any;
  Progress?: any;
  StartDate?: any;
  DueDate?: any;
  Id?: any;
  AssignedTo?: any[];
  TaskType?: string;
  isValid?: true;
}

const MainComponent = (props: any) => {
  // const listWeb = Web("https://chandrudemo.sharepoint.com/sites/testXML14");
  const listWeb = Web(
    "https://libitinaco.sharepoint.com/sites/CemeterySociety2"
  );
  const [masterTasksList, setMasterTasksList] = useState<taskDetails[]>();
  const [allTasksList, setAllTasksList] = useState<taskDetails[]>();
  const [showTasksList, setShowTasksList] = useState<taskDetails[]>();
  const [userCemeteryList, setUserCemeteryList] = useState<dropDownOptions[]>();
  const [formData, setFormData] = useState<formDataDetails>();
  const [openForm, setOpenForm] = useState(false);
  const [isLoader, setIsLoader] = useState(false);
  // const [itemOffset, setItemOffset] = useState(0);
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(5);
  const [searchQuery, setSearchQuery] = useState("");
  console.log("allTasksList", allTasksList);

  const createNewForm = () => {
    setFormData({
      Title: "",
      Description: "",
      CemeteryLocation: {
        Id: "",
        key: "",
        text: "",
        GroupName: "",
      },
      TaskType: "New",
      StartDate: "",
      DueDate: "",
      Priority: "Medium",
      Progress: "Not started",
      AssignedTo: [],
      Id: 0,
      isValid: true,
    });
    setOpenForm(true);
  };

  const onOpenForm = (rowData: any, type: string) => {
    setFormData({
      Title: rowData?.Title,
      Description: rowData?.Description,
      TaskType: type,
      StartDate: new Date(rowData?.StartDate),
      DueDate: new Date(rowData?.DueDate),
      Priority: rowData?.Priority,
      Progress: rowData?.Progress,
      AssignedTo: rowData?.AssignedTo,
      Id: rowData?.Id,
      CemeteryLocationId: rowData?.CemeteryLocationId,
      CemeteryLocation: {
        Id: rowData?.CemeteryLocationId,
        key: rowData?.CemeteryLocationId,
        text: rowData?.CemeteryLocation,
        GroupName: rowData?.GroupName,
      },
      GroupName: rowData?.GroupName,
      Notes: rowData?.Notes,
      isValid: true,
    });
    setOpenForm(true);
  };

  const getUserBasedGroups = async () => {
    try {
      setIsLoader(true);
      //const user = await listWeb.currentUser.get();
      const client = await props?.SpContext?._msGraphClientFactory.getClient();
      let groups: any[] = [];
      let url = `/me/memberOf`;

      while (url) {
        const response = await client.api(url).get();
        if (response?.value) {
          groups = groups.concat(response.value);
        }
        // Check for paging
        url = response["@odata.nextLink"]
          ? response["@odata.nextLink"].replace(
              "https://graph.microsoft.com/v1.0",
              ""
            )
          : null;
      }

      const locationGroupList: dropDownOptions[] = [];
      await listWeb.lists
        .getByTitle("CemeteryGroupConfigure")
        .items.top(5000)
        .get()
        .then((res: any) => {
          res?.forEach((item: any) => {
            const tempObj: dropDownOptions = {
              Id: item.Id,
              key: item.Id,
              text: item.Title,
              GroupName: item.GroupName,
            };
            locationGroupList.push(tempObj);
          });
        })
        .catch((err: any) => {
          console.log(err);
        });

      const userGroupNames: string[] =
        groups?.map((group: any) => group.displayName) || [];
      const permittedLocations = locationGroupList.filter((loc: any) =>
        userGroupNames?.includes(loc?.GroupName)
      );

      const groupIds = permittedLocations.map((g) => g.Id);

      // Build OR filter string: (groupNameID eq 1) or (groupNameID eq 3) ...
      const filterString = groupIds
        .map((id) => `CemeteryLocation eq ${id}`)
        .join(" or ");

      const userBasedTasksList = await listWeb.lists
        .getByTitle("AllTasks")
        .items.select(
          "*,AssignedTo0/Id,AssignedTo0/Title,AssignedTo0/EMail,CemeteryLocation/Id,CemeteryLocation/Title,CemeteryLocation/GroupName"
        )
        .expand("AssignedTo0,CemeteryLocation")
        .filter(filterString)
        .top(5000) // You can use pagination if needed
        .get();

      const tempArray: taskDetails[] = [];
      userBasedTasksList?.forEach((item: any) => {
        const bindAssignedUsers: any[] = item.AssignedTo0?.map((User: any) => {
          return {
            text: User?.Title,
            secondaryText: User?.EMail,
          };
        });
        const tempObj: taskDetails = {
          Id: item.Id,
          Title: item.Title,
          Description: item.Description,
          Priority: item.Priority,
          Progress: item.Progress,
          StartDate: item.StartDate,
          DueDate: item.DueDate,
          AssignedTo: bindAssignedUsers,
          CemeteryLocationId: item.CemeteryLocation?.Id,
          CemeteryLocation: item.CemeteryLocation?.Title,
          Notes: item.Notes,
          GroupName: item.CemeteryLocation?.GroupName,
        };
        tempArray.push(tempObj);
      });
      const sortedArray = [...tempArray].sort((a, b) => b.Id - a.Id);
      // setAllTasksList(sortedArray);
      setAllTasksList([...sortedArray]);
      setMasterTasksList([...sortedArray]);
      setUserCemeteryList([...permittedLocations]);
      setIsLoader(false);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    getUserBasedGroups();
  }, []);

  useEffect(() => {
    const sliced = allTasksList?.slice(first, first + rows);
    setShowTasksList(sliced);
  }, [first, rows, allTasksList]);

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case "not started":
        return "#ff8080";
      case "in progress":
        return "#ffff00a3";
      case "completed":
        return "#008000bf";
      default:
        return "#6C757D";
    }
  };

  const formattedDate = (date: any) => {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
      .format(new Date(date))
      .replace(/\//g, "-");
  };

  const descriptionBodyTemplate = (rowData: any) => {
    return (
      <div>
        <p title={rowData?.Description} className="description-body">
          {rowData?.Description}
        </p>
      </div>
    );
  };

  const priorityBodyTemplate = (rowData: any) => {
    return (
      <div>
        {rowData?.Priority === "Critical" ? (
          <i className="pi pi-info-circle" style={{ fontSize: "0.7rem" }}></i>
        ) : rowData?.Priority === "High" ? (
          <i className="pi pi-arrow-up" style={{ fontSize: "0.7rem" }}></i>
        ) : rowData?.Priority === "Low" ? (
          <i className="pi pi-arrow-down" style={{ fontSize: "0.7rem" }}></i>
        ) : (
          <></>
        )}
        <span style={{ marginLeft: "5px" }}>{rowData?.Priority}</span>
      </div>
    );
  };
  const progressBodyTemplate = (rowData: any) => {
    return (
      <span
        style={{
          backgroundColor: getStatusColor(rowData?.Progress),
          padding: "2px 10px 5px 10px",
          borderRadius: "50px",
          color:
            rowData?.Progress.toLowerCase() === "completed" ? "#fff" : "black",
          fontWeight: 500,
          display: "inline-block",
        }}
      >
        {rowData?.Progress}
      </span>
    );
  };
  const startDateBodyTemplate = (rowData: any) => {
    return <span>{formattedDate(rowData?.StartDate)}</span>;
  };

  const dueDateBodyTemplate = (rowData: any) => {
    return <span>{formattedDate(rowData?.DueDate)}</span>;
  };

  const actionBodyTemplate = (rowData: any) => {
    return (
      <div style={{ display: "flex", gap: "10px" }}>
        <i
          className="pi pi-eye"
          style={{ color: "slateblue", cursor: "pointer" }}
          onClick={() => onOpenForm(rowData, "View")}
        ></i>
        <i
          className="pi pi-file-edit"
          style={{ color: "slateblue", cursor: "pointer" }}
          onClick={() => onOpenForm(rowData, "Edit")}
        ></i>
      </div>
    );
  };

  // pagination function

  const onPageChange = (event: any) => {
    setFirst(event.first);
    setRows(event.rows);
  };

  // Search functionality

  const serachQueryFunction = (value: string) => {
    setSearchQuery(value);
    const tempArray: taskDetails[] = (masterTasksList || []).filter(
      (item: any) => {
        return (
          item?.Title?.toLowerCase().includes(value.toLowerCase()) ||
          item?.Description?.toLowerCase().includes(value.toLowerCase()) ||
          item?.CemeteryLocation?.toLowerCase().includes(value.toLowerCase()) ||
          item?.Priority?.toLowerCase().includes(value.toLowerCase()) ||
          item?.Progress?.toLowerCase().includes(value.toLowerCase()) ||
          item?.AssignedTo?.some((user: any) =>
            user?.text?.toLowerCase().includes(value.toLowerCase())
          ) ||
          item?.StartDate?.toLowerCase().includes(value.toLowerCase()) ||
          item?.DueDate?.toLowerCase().includes(value.toLowerCase())
        );
      }
    );
    setAllTasksList([...tempArray]);
  };

  return (
    <div>
      {openForm ? (
        <TaskForm
          webPartProps={props}
          initialData={formData}
          userCemeteryList={userCemeteryList}
          setAllTasksList={setAllTasksList}
          setOpenForm={setOpenForm}
        />
      ) : isLoader ? (
        <div className={styles.loaderSection}>
          <i
            className="pi pi-spin pi-spinner"
            style={{ fontSize: "2rem", color: "#6c87a1" }}
          ></i>
        </div>
      ) : (
        <div className="taskTableContainer">
          <div className={styles.headerSection}>
            <div>
              <h3>Task List</h3>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <div className="searchBox">
                <InputText
                  value={searchQuery}
                  type="text"
                  className="p-inputtext-sm"
                  placeholder="Search"
                  onChange={(e) => serachQueryFunction(e.target.value)}
                />
              </div>
              <Button
                // style={{ backgroundColor: "#69797e" }}
                severity="secondary"
                size="small"
                label="Task"
                icon="pi pi-plus"
                onClick={createNewForm}
              />
            </div>
          </div>
          <div className={styles.desktopView}>
            <div className={styles.taskTableWrapper}>
              <DataTable
                className="taskTable"
                value={showTasksList}
                // paginator
                // rows={5}
                // rowsPerPageOptions={[5, 10, 25, 50]}
                tableStyle={{ minWidth: "50rem" }}
              >
                <Column
                  style={{ width: "20%", fontWeight: "500" }}
                  field="Title"
                  header="Title"
                ></Column>
                <Column
                  style={{
                    width: "30%",
                  }}
                  field="Description"
                  header="Description"
                  body={descriptionBodyTemplate}
                ></Column>
                <Column
                  style={{ width: "10%" }}
                  field="Priority"
                  header="Priority"
                  body={priorityBodyTemplate}
                ></Column>
                <Column
                  style={{ width: "10%" }}
                  field="Progress"
                  header="Progress"
                  body={progressBodyTemplate}
                ></Column>
                <Column
                  style={{ width: "10%" }}
                  field="DueDate"
                  header="Start Date"
                  body={startDateBodyTemplate}
                ></Column>
                <Column
                  style={{ width: "10%" }}
                  field="DueDate"
                  header="Due Date"
                  body={dueDateBodyTemplate}
                ></Column>
                <Column
                  style={{ width: "10%" }}
                  field="Id"
                  header=""
                  body={actionBodyTemplate}
                ></Column>
              </DataTable>
            </div>
            {(allTasksList?.length ?? 0) > 5 && (
              <Paginator
                first={first}
                rows={rows}
                totalRecords={allTasksList?.length}
                rowsPerPageOptions={[10, 20, 30]}
                onPageChange={onPageChange}
              />
            )}
          </div>

          <div
            className={`${
              (allTasksList?.length ?? 0) < 5 ? styles.fullmobileView : ""
            } ${styles.mobileView}`}
          >
            {showTasksList?.length === 0 && (
              <div className={styles.noDataFound}>
                <span>No tasks found</span>
              </div>
            )}
            {showTasksList?.map((task: any, index: number) => (
              <div key={index} className={styles.card}>
                <div className={styles.cardHeader}>
                  <h3>{task.Title}</h3>
                </div>
                <div className={styles.cardContent}>
                  <p>
                    <img
                      src={require("../../../images/marker.png")}
                      alt=""
                      width={15}
                      height={15}
                    />
                    {task.CemeteryLocation}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      alignItems: "center",
                    }}
                  >
                    <p>
                      <img
                        src={require("../../../images/priority-arrows.png")}
                        alt=""
                        width={15}
                        height={15}
                      />
                      {task.Priority}
                    </p>
                    <p>
                      <img
                        src={require("../../../images/calendar-clock.png")}
                        alt=""
                        width={15}
                        height={15}
                      />{" "}
                      {formattedDate(task.DueDate)}
                    </p>
                  </div>
                  <div className={styles.cardProgress}>
                    <span
                      style={{
                        backgroundColor: getStatusColor(task?.Progress),
                        padding: "2px 10px 5px 10px",
                        borderRadius: "50px",
                        color:
                          task.Progress.toLowerCase() === "completed"
                            ? "#fff"
                            : "black",
                        fontWeight: 500,
                        display: "inline-block",
                      }}
                    >
                      {task?.Progress}
                    </span>
                    <div style={{ display: "flex", gap: "20px" }}>
                      <i
                        className="pi pi-eye"
                        style={{ color: "slateblue", cursor: "pointer" }}
                        onClick={() => onOpenForm(task, "View")}
                      ></i>
                      <i
                        className="pi pi-file-edit"
                        style={{ color: "slateblue", cursor: "pointer" }}
                        onClick={() => onOpenForm(task, "Edit")}
                      ></i>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {(allTasksList?.length ?? 0) > 5 && (
            <div className={`mobilePaginationSec ${styles.mobilePaginator}`}>
              <Paginator
                first={first}
                rows={rows}
                totalRecords={allTasksList?.length}
                onPageChange={onPageChange}
                template="FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MainComponent;
