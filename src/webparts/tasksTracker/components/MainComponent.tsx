/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-var-requires */
import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { Button } from "primereact/button";
import { Paginator } from "primereact/paginator";
import { Web } from "@pnp/sp/webs";
import { Toast } from "primereact/toast";
import styles from "./TasksTracker.module.scss";
import "./style.css";
import "@pnp/graph/groups";
import TaskForm from "./taskForm/TaskForm";
import { Avatar } from "primereact/avatar";
import FilterSection from "./FilterSection/FilterSection";
import {
  DirectionalHint,
  Label,
  Persona,
  PersonaPresence,
  PersonaSize,
  TooltipDelay,
  TooltipHost,
} from "@fluentui/react";
import CustomLoader from "./CustomLoader/CustomLoader";
import MediaPreview from "./MediaPreview/MediaPreview";
import { Dialog } from "primereact/dialog";
const deleteIcon = require("../../../images/delete.png");
import "./commonStyle.css";

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
  PreNotes?: string;
  CemeteryLocationId?: number;
  CemeteryLocation?: any;
  GroupName?: string;
  Priority?: any;
  Progress?: any;
  PreProgress?: any;
  StartDate?: any;
  DueDate?: any;
  Id?: any;
  AssignedTo?: any[];
  AssignedBy?: any[];
  TaskType?: string;
  isValid?: boolean;
  recOwner?: boolean;
  reOpenComments?: string;
}

const MainComponent = (props: any) => {
  // development site
  const listWeb = Web("https://chandrudemo.sharepoint.com/sites/TechnorucsV1");

  // production site
  // const listWeb = Web(
  //   "https://libitinaco.sharepoint.com/sites/CemeterySociety2"
  // );

  // const priorityOrderAsc = ["Low", "Medium", "High", "Critical"];
  // const priorityOrderDesc = [...priorityOrderAsc].reverse();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollContainerMobileRef = useRef<HTMLDivElement>(null);
  const toast = useRef<Toast>(null);
  const [sortState, setSortState] = useState({ Location: 0, Date: 0 }); // 0: Default, 1: Asc, 2: Desc
  const [masterTasksList, setMasterTasksList] = useState<taskDetails[]>();
  const [allTasksList, setAllTasksList] = useState<taskDetails[]>();
  const [showTasksList, setShowTasksList] = useState<taskDetails[]>();
  const [userCemeteryList, setUserCemeteryList] = useState<dropDownOptions[]>();
  const [cemeteryListwithBg, setCemeteryListwithBg] = useState<any[]>();
  const [formData, setFormData] = useState<formDataDetails>();
  const [openForm, setOpenForm] = useState(false);
  const [isLoader, setIsLoader] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [imagePreview, setImagePreview] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<any>({});
  const [images, setImages] = useState<any[]>([]);
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(9);
  const [expandCard, setExpandCard] = useState<any>(null);
  const [deleteData, setDeleteData] = useState<any>({
    Id: null,
    isPopup: false,
  });

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
      PreProgress: "",
      Notes: "",
      PreNotes: "",
      AssignedTo: [],
      AssignedBy: [],
      Id: 0,
      isValid: true,
      recOwner: true,
    });
    setAllTasksList(masterTasksList);
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
      PreProgress: rowData?.Progress,
      AssignedTo: rowData?.AssignedTo,
      AssignedBy: rowData?.AssignedBy,
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
      PreNotes: rowData?.Notes,
      isValid: true,
      recOwner: rowData?.recOwner,
      reOpenComments: "",
    });
    setAllTasksList(masterTasksList);
    setOpenForm(true);
  };

  const getUserBasedGroups = async (isCompleted: boolean) => {
    try {
      setIsLoader(true);
      const user = await listWeb.currentUser.get();

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
      const adminUsers = await listWeb.siteGroups
        .getByName("CemeterySocietyAdmin")
        .users();

      const isMember = adminUsers.some((admin) => admin.Id === user.Id);
      const locationGroupList: dropDownOptions[] = [];
      const locationGroupBG: any[] = [];
      await listWeb.lists
        .getByTitle("CemeteryGroupConfigure")
        .items.top(5000)
        .get()
        .then((res: any) => {
          res?.forEach(async (item: any) => {
            const tempObj: dropDownOptions = {
              Id: item.Id,
              key: item.Id,
              text: item.Title,
              GroupName: item.GroupName,
            };
            const backgroundColor = {
              title: item.Title,
              backgroundColor: item.BackgroundColor,
            };
            locationGroupBG.push(backgroundColor);
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

      const fullFilter = `(${filterString}) and Progress ${
        isCompleted ? "eq" : "ne"
      } 'Completed' and isDeleted ne 1`;
      const notCompleteFilter = `Progress ${
        isCompleted ? "eq" : "ne"
      } 'Completed' and isDeleted ne 1`;

      const userBasedTasksList = await listWeb.lists
        .getByTitle("AllTasks")
        .items.select(
          "*,AssignedTo0/Id,AssignedTo0/Title,AssignedTo0/EMail,CemeteryLocation/Id,CemeteryLocation/Title,CemeteryLocation/GroupName,Author/Id,Author/Title,Author/EMail,AttachmentFiles"
        )
        .expand("AssignedTo0,CemeteryLocation,Author,AttachmentFiles")
        .filter(isMember ? notCompleteFilter : fullFilter)
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
        const isAssigned = item.AssignedTo0?.some(
          (userDetails: any) =>
            userDetails?.EMail?.toLowerCase() === user?.Email.toLowerCase()
        );

        const isCreatedBy = item?.Author?.Id === user?.Id;

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
          recOwner: isCreatedBy ? true : isMember ? true : false,
          AssignedBy: [
            {
              text: item.Author?.Title,
              secondaryText: item.Author?.EMail,
            },
          ],
          isAttachment: item?.AttachmentFiles?.length > 0 ? true : false,
        };
        if (isCreatedBy || isAssigned || isMember) {
          tempArray.push(tempObj);
        }
      });
      const sortedArray = [...tempArray].sort((a, b) => b.Id - a.Id);
      // setAllTasksList(sortedArray);
      setAllTasksList([...sortedArray]);
      setMasterTasksList([...sortedArray]);
      setUserCemeteryList(
        isMember ? [...locationGroupList] : [...permittedLocations]
      );
      setCemeteryListwithBg(locationGroupBG);
      setIsLoader(false);
      setIsCompleted(isCompleted);
      setIsAdmin(isMember);
      setFirst(0);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSortByDate = (Data: taskDetails[], type: string) => {
    const nextState =
      type === "click" ? (sortState?.Date + 1) % 3 : sortState?.Date;
    type === "click"
      ? setSortState({ ...sortState, Date: nextState, Location: 0 })
      : setSortState({ ...sortState, Date: nextState });

    let sortedTasks = [...Data];

    if (nextState === 1) {
      // Ascending
      sortedTasks.sort(
        (a, b) => new Date(a.DueDate).getTime() - new Date(b.DueDate).getTime()
      );
    } else if (nextState === 2) {
      // Descending
      sortedTasks.sort(
        (a, b) => new Date(b.DueDate).getTime() - new Date(a.DueDate).getTime()
      );
    } else {
      if (sortState?.Location === 0) {
        // Default (reset by Id)
        sortedTasks = sortedTasks.sort((a: any, b: any) => b.Id - a.Id);
      }
    }

    setFirst(0);
    (sortState?.Location === 0 || type === "click") &&
      setAllTasksList(sortedTasks);
  };

  const handleSortByLocation = (Data: taskDetails[], type: string) => {
    const nextState =
      type === "click" ? (sortState?.Location + 1) % 3 : sortState?.Location;
    type === "click"
      ? setSortState({ ...sortState, Location: nextState, Date: 0 })
      : setSortState({ ...sortState, Location: nextState });

    let sortedTasks = [...Data];

    if (nextState === 1) {
      // Ascending (A-Z)
      sortedTasks.sort((a, b) =>
        (a?.CemeteryLocation || "").localeCompare(b?.CemeteryLocation || "")
      );
    } else if (nextState === 2) {
      // Descending (Z-A)
      sortedTasks.sort((a, b) =>
        (b?.CemeteryLocation || "").localeCompare(a?.CemeteryLocation || "")
      );
    } else {
      if (sortState?.Date === 0) {
        // Default (reset by Id)
        sortedTasks = sortedTasks.sort((a: any, b: any) => b.Id - a.Id);
      }
    }
    setFirst(0);
    (sortState?.Date === 0 || type === "click") && setAllTasksList(sortedTasks);
  };

  useEffect(() => {
    toast.current && toast.current.show(showToast);
  }, [showToast]);

  useEffect(() => {
    getUserBasedGroups(false);
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
      case "job completed":
        return "#008000bf";
      case "completed":
        return "#008000bf";
      default:
        return "#6C757D";
    }
  };

  const formattedDate = (date: any) => {
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const year = d.getFullYear();
    return `${month}-${day}-${year}`;
  };

  const locationBodyTemplate = (location: any) => {
    const getBGCode = cemeteryListwithBg?.find(
      (item) => item.title === location
    )?.backgroundColor;
    return (
      <p style={{ whiteSpace: "nowrap" }}>
        <span
          style={{
            backgroundColor: getBGCode ? getBGCode : "#b4b4b4",
            color: "#fff",
            padding: "5px 10px",
            fontWeight: "500",
            borderRadius: "5px",
            fontSize: "13px",
          }}
          title={location}
        >
          {location}
        </span>
      </p>
    );
  };

  const usersBodyTemplate = (users: any[]) => {
    return (
      <div>
        {users?.length ? (
          <div
            className="user-selector-group"
            style={{
              display: "flex",
              width: "100%",
              overflow: "auto",
            }}
          >
            {users?.map((value: any, index: number) => {
              if (index < 2) {
                return (
                  <div style={{ width: "100%" }} key={index}>
                    <Persona
                      styles={{
                        root: {
                          width: "25%!important",
                          cursor: "pointer",
                          margin: "0 !important;",
                          ".ms-Persona-details": {
                            display: "none",
                          },
                        },
                      }}
                      imageUrl={
                        "/_layouts/15/userphoto.aspx?size=S&username=" +
                        value.secondaryText
                      }
                      title={value.text}
                      size={PersonaSize.size32}
                    />
                    <p
                      className={`${
                        users?.length > 1 ? "user-name" : "user-full-name"
                      }`}
                      title={value.text}
                    >
                      {value.text}
                      {users?.length > 1 && users?.length !== index + 1
                        ? ", "
                        : ""}
                    </p>
                  </div>
                );
              }
            })}

            {users?.length > 2 ? (
              <TooltipHost
                className="all-member-users"
                content={
                  <ul style={{ margin: 10, padding: 0 }}>
                    {users?.map((DName: any, index: number) => {
                      return (
                        <li style={{ listStyleType: "none" }} key={index}>
                          <div style={{ display: "flex" }}>
                            <Persona
                              showOverflowTooltip
                              size={PersonaSize.size24}
                              presence={PersonaPresence.none}
                              showInitialsUntilImageLoads={true}
                              imageUrl={
                                "/_layouts/15/userphoto.aspx?size=S&username=" +
                                `${DName.secondaryText}`
                              }
                            />
                            <Label style={{ marginLeft: 10, fontSize: 12 }}>
                              {DName.text}
                            </Label>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                }
                delay={TooltipDelay.zero}
                directionalHint={DirectionalHint.bottomCenter}
                styles={{ root: { display: "inline-block" } }}
              >
                <div className={styles.Persona}>
                  +{users.length - 2}
                  <div className={styles.AllPersona} />
                </div>
              </TooltipHost>
            ) : null}
          </div>
        ) : (
          ""
        )}
      </div>
    );
  };
  const priorityColors: Record<string, string> = {
    Critical: "#e74c3c",
    High: "#e67e22",
    Medium: "#3498db",
    Low: "#2ecc71",
  };

  const priorityBodyTemplate = (rowData: any) => {
    return (
      <div
        style={{
          color: `${priorityColors[rowData.Priority]}`,
          fontWeight: "500",
        }}
      >
        {rowData?.Priority === "Critical" ? (
          <i className="pi pi-info-circle" style={{ fontSize: "0.7rem" }} />
        ) : rowData?.Priority === "High" ? (
          <i className="pi pi-arrow-up" style={{ fontSize: "0.7rem" }} />
        ) : rowData?.Priority === "Low" ? (
          <i className="pi pi-arrow-down" style={{ fontSize: "0.7rem" }} />
        ) : (
          <></>
        )}
        <span style={{ marginLeft: "5px", fontSize: "13px" }}>
          {rowData?.Priority}
        </span>
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
            rowData?.Progress.toLowerCase() === "completed" ||
            rowData?.Progress.toLowerCase() === "job completed"
              ? "#fff"
              : "black",
          fontWeight: 500,
          display: "inline-block",
          fontSize: "13px",
          textAlign: "center",
        }}
      >
        {rowData?.Progress}
      </span>
    );
  };
  // const startDateBodyTemplate = (rowData: any) => {
  //   return <span>{formattedDate(rowData?.StartDate)}</span>;
  // };

  const dueDateBodyTemplate = (rowData: any) => {
    return (
      <span
        style={{ fontSize: "13px" }}
        title={formattedDate(rowData?.DueDate)}
      >
        {formattedDate(rowData?.DueDate)}
      </span>
    );
  };

  const actionBodyTemplate = (rowData: any) => {
    return (
      <div style={{ display: "flex", gap: "10px" }}>
        <i
          className={`pi ${
            expandCard === rowData?.Id ? "pi-angle-up" : "pi-angle-down"
          } expandIcon`}
          style={{ color: "slateblue", cursor: "pointer", fontSize: "14px" }}
          title="Expand/Collapse"
          onClick={() =>
            setExpandCard(expandCard === rowData?.Id ? null : rowData?.Id)
          }
        />
        <i
          className="pi pi-eye"
          style={{ color: "slateblue", cursor: "pointer", fontSize: "14px" }}
          title="View"
          onClick={() => onOpenForm(rowData, "View")}
        />
        {rowData?.Progress.toLowerCase() !== "completed" &&
          (rowData?.Progress.toLowerCase() !== "job completed" ? (
            <i
              className="pi pi-file-edit"
              style={{
                color: "slateblue",
                cursor: "pointer",
                fontSize: "14px",
              }}
              title="Edit"
              onClick={() => onOpenForm(rowData, "Edit")}
            />
          ) : (
            rowData?.recOwner && (
              <i
                className="pi pi-file-edit"
                style={{
                  color: "slateblue",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
                title="Edit"
                onClick={() => onOpenForm(rowData, "Edit")}
              />
            )
          ))}
        {rowData?.isAttachment && (
          <i
            className="pi pi-image"
            style={{ color: "slateblue", cursor: "pointer", fontSize: "14px" }}
            title="Attachments"
            onClick={() => getAttachments(rowData?.Id)}
          />
        )}
        {(isAdmin || rowData?.recOwner) && (
          <img
            src={deleteIcon}
            alt="delete"
            width={13}
            height={13}
            style={{ cursor: "pointer" }}
            onClick={() => {
              setDeleteData({
                Id: rowData?.Id,
                isPopup: true,
              });
            }}
          />
        )}
      </div>
    );
  };

  // pagination function

  const onPageChange = (event: any) => {
    if (scrollContainerRef.current) {
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
        }
      }, 0);
    }
    if (scrollContainerMobileRef.current) {
      setTimeout(() => {
        if (scrollContainerMobileRef.current) {
          scrollContainerMobileRef.current.scrollTo({
            top: 0,
            behavior: "smooth",
          });
        }
      }, 0);
    }
    setFirst(event.first);
    setRows(event.rows);
  };

  // get Attachments function

  const getAttachments = (id: any) => {
    listWeb.lists
      .getByTitle("AllTasks")
      .items.getById(id)
      .attachmentFiles.get()
      .then((res: any) => {
        const tempArray: any[] = [];
        res?.forEach((item: any) => {
          const tempObj = {
            id: item.Id, // Unique ID
            url: item.ServerRelativeUrl,
            file: item, // Store actual file
            name: item.FileName,
          };
          tempArray.push(tempObj);
        });
        setImages(tempArray);
        setImagePreview(true);
      })
      .catch((err: any) => {
        console.log(err);
      });
  };

  const deleteTaskFunction = async () => {
    const payload = {
      isDeleted: true,
    };
    await listWeb.lists
      .getByTitle("AllTasks")
      .items.getById(deleteData?.Id)
      .update(payload)
      .then((res: any) => {
        const masterUpdatedList = masterTasksList?.filter(
          (obj, index) => obj?.Id !== deleteData?.Id
        );
        setMasterTasksList?.(masterUpdatedList);
        const tempTasksList = allTasksList?.filter(
          (obj, index) => obj?.Id !== deleteData?.Id
        );
        setAllTasksList?.(tempTasksList);
        setDeleteData({
          Id: null,
          isPopup: false,
        });
        setShowToast({
          severity: "success",
          summary: "Success",
          detail: `The task has been deleted successfully.`,
          life: 3000,
        });
      })
      .catch((err) => {
        console.log("Error : ", err);
      });
  };

  return (
    <div>
      {openForm ? (
        <TaskForm
          webPartProps={props}
          initialData={formData}
          userCemeteryList={userCemeteryList}
          setAllTasksList={setAllTasksList}
          setMasterTasksList={setMasterTasksList}
          setOpenForm={setOpenForm}
          setShowToast={setShowToast}
        />
      ) : isLoader ? (
        <div className={styles.loaderSection}>
          <CustomLoader />
        </div>
      ) : imagePreview ? (
        // <PreviewImages
        //   imagesData={images}
        //   imageIndex={1}
        //   setImagePreview={setImagePreview}
        // />
        <MediaPreview
          mediaList={images}
          initialIndex={0}
          onClose={setImagePreview}
        />
      ) : (
        <div className="taskTableContainer">
          <Toast ref={toast} />
          <div className={styles.headerSection}>
            <div>
              <span
                style={{
                  fontSize: "20px",
                  fontWeight: "700",
                  color: "#4f5459",
                }}
              >
                Task List
              </span>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              {/* {isAdmin && ( */}
              <Button
                style={{
                  backgroundColor: isCompleted ? "#b96859" : "#68b97b",
                  border: `1px solid ${isCompleted ? "#b96859" : "#68b97b"}`,
                  fontSize: "12px",
                }}
                severity="success"
                size="small"
                label={`${isCompleted ? "Ongoing Tasks" : "Completed Tasks"}`}
                onClick={() => getUserBasedGroups(!isCompleted)}
              />
              {/* // )} */}
              {!isCompleted && (
                <Button
                  style={{ fontSize: "12px" }}
                  severity="secondary"
                  size="small"
                  label="New Task"
                  onClick={createNewForm}
                />
              )}
            </div>
          </div>
          <FilterSection
            masterTasksList={masterTasksList || []}
            setAllTasksList={setAllTasksList}
            setFirst={setFirst}
            handleSortByDate={handleSortByDate}
            handleSortByLocation={handleSortByLocation}
            getUserBasedGroups={getUserBasedGroups}
            isCompleted={isCompleted}
          />
          <div className={styles.desktopView}>
            <div className={styles.taskTableWrapper}>
              <div className={styles.customTableHeader}>
                <div style={{ width: "20%" }}>
                  <p>Title</p>
                </div>
                <div
                  // className={styles.progressColumn}
                  style={{ width: "20%", cursor: "pointer" }}
                  onClick={() =>
                    handleSortByLocation(allTasksList || [], "click")
                  }
                >
                  <p>Cemetery location</p>
                  <i
                    className={`${
                      sortState?.Location === 0
                        ? "pi pi-sort"
                        : sortState?.Location === 1
                        ? "pi pi-sort-amount-down-alt"
                        : "pi pi-sort-amount-down"
                    }`}
                    style={{ fontSize: "1.0rem" }}
                  />
                </div>
                <div className={styles.tabletView} style={{ width: "10%" }}>
                  <p>Assigned by</p>
                </div>
                <div className={styles.progressColumn} style={{ width: "10%" }}>
                  <p>Assigned to</p>
                </div>
                <div
                  className={styles.hidePriority}
                  style={{ width: "10%", cursor: "pointer" }}
                  // onClick={() => handlePrioritySortToggle()}
                >
                  <p>Priority</p>
                  {/* <i
                    className={`${
                      sortState?.Priority === 0
                        ? "pi pi-sort"
                        : sortState?.Priority === 1
                        ? "pi pi-sort-amount-down-alt"
                        : "pi pi-sort-amount-down"
                    }`}
                    style={{ fontSize: "1.0rem" }}
                  ></i> */}
                </div>
                <div className={styles.progressColumn} style={{ width: "10%" }}>
                  <p>Progress</p>
                </div>
                <div
                  className={styles.priorityColumn}
                  style={{ width: "10%", cursor: "pointer" }}
                  onClick={() => handleSortByDate(allTasksList || [], "click")}
                >
                  <p>Due date</p>
                  <i
                    className={`${
                      sortState?.Date === 0
                        ? "pi pi-sort"
                        : sortState?.Date === 1
                        ? "pi pi-sort-amount-down-alt"
                        : "pi pi-sort-amount-down"
                    }`}
                    style={{ fontSize: "1.0rem" }}
                  />
                </div>
                <div
                  style={{
                    width: "10%",
                    display: "flex",
                  }}
                >
                  Actions
                </div>
              </div>
              <div
                ref={scrollContainerRef}
                className={`${
                  (allTasksList?.length ?? 0) < 10
                    ? styles.fullCustomTable
                    : styles.customTable
                }`}
              >
                {showTasksList?.length === 0 && (
                  <div className={styles.noDataFound}>
                    <span>No tasks found</span>
                  </div>
                )}
                {showTasksList?.map((rowData: any, index: number) => (
                  <div className={styles.tableRow} key={index}>
                    <div
                      style={{
                        width: "20%",
                        fontWeight: "500",
                      }}
                      className={styles.taskTitle}
                      title={rowData?.Title}
                    >
                      {rowData.Title}
                    </div>
                    <div
                      // className={styles.progressColumn}s
                      style={{ width: "20%", padding: "10px 15px" }}
                    >
                      {locationBodyTemplate(rowData?.CemeteryLocation)}
                      {/* {rowData.CemeteryLocation} */}
                    </div>
                    <div
                      className={styles.tabletView}
                      style={{ width: "10%", padding: "10px 15px" }}
                    >
                      {usersBodyTemplate(rowData?.AssignedBy)}
                    </div>
                    <div
                      className={styles.progressColumn}
                      style={{ width: "10%", padding: "10px 15px" }}
                    >
                      {usersBodyTemplate(rowData?.AssignedTo)}
                    </div>
                    <div
                      className={styles.hidePriority}
                      style={{ width: "10%", padding: "10px 15px" }}
                    >
                      {priorityBodyTemplate(rowData)}
                    </div>
                    <div
                      className={styles.progressColumn}
                      style={{ width: "10%", padding: "10px 15px" }}
                    >
                      {progressBodyTemplate(rowData)}
                    </div>
                    <div
                      className={styles.priorityColumn}
                      // className={styles.progressColumn}
                      style={{ width: "10%", padding: "10px 15px" }}
                    >
                      {dueDateBodyTemplate(rowData)}
                    </div>
                    <div
                      style={{
                        width: "10%",
                        padding: "10px 15px",
                        display: "flex",
                      }}
                    >
                      {actionBodyTemplate(rowData)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {(allTasksList?.length ?? 0) > 9 && (
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
            ref={scrollContainerMobileRef}
            className={`${
              (allTasksList?.length ?? 0) < 10 ? styles.fullmobileView : ""
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
                  <div>
                    <p>
                      <img
                        src={require("../../../images/marker.png")}
                        alt=""
                        width={15}
                        height={15}
                      />
                      {locationBodyTemplate(task?.CemeteryLocation)}
                      {/* {task.CemeteryLocation} */}
                    </p>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      alignItems: "center",
                    }}
                  >
                    <p
                      style={{
                        color: `${priorityColors[task.Priority]}`,
                        fontWeight: "500",
                      }}
                    >
                      <img
                        src={require("../../../images/priority-arrows.png")}
                        alt=""
                        width={15}
                        height={15}
                      />
                      {task.Priority}
                    </p>
                    <p style={{ fontWeight: "500" }}>
                      <img
                        src={require("../../../images/calendar-clock.png")}
                        alt=""
                        width={15}
                        height={15}
                      />
                      {formattedDate(task.DueDate)}
                    </p>
                    <p style={{ fontWeight: "500" }}>
                      <img
                        src={require("../../../images/user-skill-gear.png")}
                        alt=""
                        width={18}
                        height={17}
                      />
                      {task?.AssignedBy[0].text}
                    </p>
                  </div>
                  {expandCard === task?.Id && (
                    <div style={{ marginTop: "4px" }}>
                      <div
                        style={{
                          width: "100%",
                          display: "flex",
                          flexWrap: "wrap",
                        }}
                      >
                        {task?.AssignedTo?.map((user: any, index: number) => {
                          return (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                marginRight: "7px",
                              }}
                              key={index}
                            >
                              <Avatar
                                image={`/_layouts/15/userphoto.aspx?size=S&username=${user?.secondaryText}`}
                                shape="circle"
                                size="normal"
                                style={{
                                  margin: "0 !important",
                                  width: "15px",
                                  height: "15px",
                                  marginLeft:
                                    task?.AssignedBy?.length > 1
                                      ? "-10px"
                                      : "0",
                                  // position: "absolute",
                                  // left: `${positionLeft ? positionLeft * index : 0}px`,
                                  // top: `${positionTop ? positionTop : 0}px`,
                                  // zIndex: index,
                                }}
                                label={user.text}
                                title={user.text}
                              />
                              <p>{user.text}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <div className={styles.cardProgress}>
                    <p>
                      <img
                        src={require("../../../images/arrowprogress.png")}
                        alt=""
                        width={15}
                        height={15}
                      />
                      <p>
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
                      </p>
                    </p>
                    {actionBodyTemplate(task)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {(allTasksList?.length ?? 0) > 9 && (
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
      <div>
        <Dialog
          className="deletion_popup_section"
          header=""
          visible={deleteData?.isPopup}
          style={{ width: "30%" }}
          onHide={() => {
            if (!deleteData?.isPopup) return;
            setDeleteData({
              Id: null,
              ispopup: false,
            });
          }}
        >
          <div style={{ padding: "10px 20px 20px 20px", textAlign: "center" }}>
            <span
              style={{ fontSize: "20px", color: "#8f6868", fontWeight: "500" }}
            >
              Delete Confirmation!
            </span>
            <p
              style={{ marginTop: "5px", fontSize: "14px", fontWeight: "600" }}
            >
              Are you sure want to delete this task?
            </p>
            <div
              style={{ display: "flex", justifyContent: "center", gap: "10px" }}
            >
              <Button
                style={{ fontSize: "12px", padding: "5px 25px" }}
                severity="danger"
                size="small"
                label="No"
                outlined
                onClick={() => {
                  setDeleteData({
                    Id: null,
                    ispopup: false,
                  });
                }}
              />
              <Button
                style={{ fontSize: "12px", padding: "5px 25px" }}
                severity="secondary"
                size="small"
                label="Yes"
                onClick={deleteTaskFunction}
              />
            </div>
          </div>
        </Dialog>
      </div>
    </div>
  );
};

export default MainComponent;
