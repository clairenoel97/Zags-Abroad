import React, { Component } from 'react';
import axios from 'axios';
import MultiDropdownTextField from './MultiDropdownTextField.js';
import IconButton from '@material-ui/core/IconButton';
import AddIcon from '@material-ui/icons/Add';
import Snackbar from '@material-ui/core/Snackbar';
import CloseIcon from '@material-ui/icons/Close';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import CircularProgress from '@material-ui/core/CircularProgress';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import { Link } from "react-router-dom";
import Gallery from 'react-photo-gallery';
import Dimensions from 'react-dimensions';
import MUIDataTable from "mui-datatables";

import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import SwipeableViews from 'react-swipeable-views';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Typography from '@material-ui/core/Typography';

const buttonStyle = {
  margin: '5px'
};

function TabContainer({ children, dir }) {
  return (
    <Typography component="div" dir={dir} style={{ padding: 8 * 3 }}>
      {children}
    </Typography>
  );
}

TabContainer.propTypes = {
  children: PropTypes.node.isRequired,
  dir: PropTypes.string.isRequired,
};

const styles = theme => ({
  root: {
    backgroundColor: theme.palette.background.paper,
    width: 500,
  }
});

class ProgramDetailView extends Component {
  constructor(props) {
    super(props);

    this.state = {
      subjects: [], // Subjects in dropdown menu
      core: [],
      filters: [],
      courseList : [], // Courses matching a user's search
      searchBy: 'department',
      loading: true,
      showMessage : false,
      message: '',
      showLogInPrompt: false,
      photos: [],
      currentIndex: 0,
      translateValue: 0,
      columns: [
        { name: "ID",
          options: { display: false } },
        { name: "Gonzaga Course" },
        { name: "Host Course" },
        { name: "Signature needed" },
        { name: "Core Designation" },
        { name: "",
          options: {
            customBodyRender: (value, tableMeta, updateValue) => {
              return (
                <IconButton onClick={(event) => this.saveCourse(value)}
                  color="primary"><AddIcon/>
                </IconButton>
              );
            },
          }
        }
      ],
      surveyColumns: [
        { name: "Name",
          options: { display: false } },
        { name: "Major" },
        { name: "Year" },
        { name: "Classes" },
      ],
      surveys: [],
      tabValue: 0
    }

    //getting all of the programs for the dropdown
    axios.post("https://zagsabroad-backend.herokuapp.com/programsubjects", {"program": this.props.name}).then((res) => {
      let subjectsToAdd = [];
      for(let i = 0; i < res.data.length; i++) {
        let subjectName = res.data[i].subject_name.trim(); // Remove any white space
        let subjectCode = res.data[i].subject_code.trim();
        let subjectObj = {value: subjectCode, label: subjectName};
        subjectsToAdd.push(subjectObj);
      }
      this.setState({subjects: subjectsToAdd});
    });

    //getting all of the core for the dropdown
    axios.post("https://zagsabroad-backend.herokuapp.com/programcore", {"program": this.props.name}).then((res) => {
      let coreToAdd = [];
      for(let i = 0; i < res.data.length; i++) {
        let coreName = res.data[i].core_name.trim(); // Remove any white space
        let coreObj = {value: "CORE: " + coreName, label: coreName};
        coreToAdd.push(coreObj);
      }
      this.setState({core: coreToAdd}, () => {
        // Fetch all courses and photos AFTER state has changed
        this.getAllCourses();
        this.getAllPhotos();
      });
    });

    axios.post("https://zagsabroad-backend.herokuapp.com/programsurveys", {"program": this.props.name}).then((res) => {
      let surveysToAdd = [];
      for(let i = 0; i < res.data.length; i++) {
         let major = res.data[i].major.trim(); // Remove any white space
         let email = ((res.data[i].email) ? res.data[i].email.trim() : ""); //
         let name = ((res.data[i].name) ? res.data[i].name.trim() : ""); //
         let program = res.data[i].program.trim();
         let term = res.data[i].term.trim();
         let year = res.data[i].year.trim();
         let residence = ((res.data[i].residence) ? res.data[i].residence.trim() : ""); //
         let trips = ((res.data[i].trips) ? res.data[i].trips.trim() : ""); //
         let classes = ((res.data[i].classes) ? res.data[i].classes.trim() : ""); //
         let activities = ((res.data[i].activities) ? res.data[i].activities.trim() : ""); //
         let staff = ((res.data[i].staff) ? res.data[i].staff.trim() : ""); //
         let other = ((res.data[i].other) ? res.data[i].other.trim() : ""); //
        surveysToAdd.push(res.data[i]);
      }
      this.setState({surveys: surveysToAdd});
      console.log(this.state.surveys);
    });
  }

  // Populate table with relevant courses in list
  formatCourses(data) {
    let courses = [];
    for(var i = 0; i < data.length; i++) {
      let newCourse = [];
      newCourse.push(data[i].id);
      newCourse.push(data[i].gu_course_number + (data[i].gu_course_name ? ": " + data[i].gu_course_name : ""));
      newCourse.push(data[i].host_course_number ? data[i].host_course_number + ": " + data[i].host_course_name :
      data[i].host_course_name);
      newCourse.push(data[i].signature_needed);
      newCourse.push(data[i].core);
      newCourse.push(data[i].id);
      courses.push(newCourse);
    }
    this.setState({courseList: courses, loading: false});
  }

  // No filters, Pull all courses in program
  getAllCourses() {
    this.setState({courseList: [], loading: true})
    axios.post("https://zagsabroad-backend.herokuapp.com/programcourses", {"program": this.props.name}).then((res) => {
      this.formatCourses(res.data);
    });
  }

  // Get all of the photos from a specific program
  getAllPhotos() {
    this.setState({photos: [], loading: true})
    let program = {
      "program": this.props.name
    }
    axios.post("https://zagsabroad-backend.herokuapp.com/programphotos", program).then((res) => {
      console.log(res.data)
      let photoList = [];
      for(var i = 0; i < res.data.length; i++) {
        photoList.push(res.data[i])

      }
      this.setState({photos: photoList, loading: false})
      console.log("Here are the photos")
      console.log(this.state.photos)
    })
  }

  // Filters applied, pull matching courses in program
  getCourses() {
    this.setState({courseList: [], loading: true})
    let params = {
      "program": this.props.name,
      "core": this.state.filters.filter(filter => filter.value.includes("CORE: ")).map((filter) => filter.label),
      "subjects": this.state.filters.filter(filter => filter.value !== 'core').map((filter) => filter.value)
    }
    axios.post("https://zagsabroad-backend.herokuapp.com/detailsearch", params).then((res) => {
      this.formatCourses(res.data);
    });
  }

  saveCourse(id) {
    let email = this.props.cookies.get('email');
    if(email) {
      // User is logged in
      let params = {
        "email": email,
        "course_id": id
      }
      axios.post("https://zagsabroad-backend.herokuapp.com/savecourse", params).then((res) => {
        if(res.data.code === "ER_DUP_ENTRY") {
          this.setState({showMessage: true, message: "Course already added.  See My Account"});
        } else if(res.data.errno) {
          this.setState({showMessage: true, message: "Error saving course"});
        } else {
          this.setState({showMessage: true, message: "Course saved to My Account"});
        }
      });
    } else {
      // Not logged in
      this.setState({showLogInPrompt: true})
    }
  }

  handleSize(image) {
    console.log(image.offsetWidth, image.offsetHeight)
  }

  handleChange = name => value => {
    this.setState({
      [name]: value,
    }, () => {
      (this.state.filters.length > 0) ? this.getCourses() : this.getAllCourses();
    });
  };

  handleTabChange = (event, value) => {
    this.setState({ value });
  };

  handleTabChangeIndex = index => {
    this.setState({ value: index });
  };

  render() {
    const options = {
      print: false, // Remove print icon
      filter: false,
      search: false,
      download: false,
      viewColumns: false,
      selectableRows: false,
      rowsPerPage: 10, // Default to 10 rows per page
      rowsPerPageOptions: [10, 20, 30],
      responsive: "scroll"
    };
    const {photos} = this.state;
    const {classes, theme} = this.props;

    return (
      <div style={{textAlign: 'center'}}>
        <h1>{this.props.name}</h1>
        <p style={{display: 'inline'}}> Search by: </p>
        <div style={{marginLeft: '10px', display: 'inline-block', verticalAlign: 'bottom'}}>
          <Select autoWidth={true} value={this.state.searchBy}
            onChange = { (event) =>
              this.setState({searchBy : event.target.value})}>
            <MenuItem value='department'> Department </MenuItem>
            <MenuItem value='core'> Core designation </MenuItem>
          </Select>
        </div>
        <div style={{marginLeft: '10px', width: '575px', display: 'inline-block', verticalAlign: 'bottom',
          zIndex: 1, position: 'relative'}}>
          <MultiDropdownTextField
            value = { this.state.filters }
            onChange = { this.handleChange("filters")}
            options = {this.state.searchBy === 'department' ? this.state.subjects : this.state.core}
          />
        </div>
        <div style={{marginLeft: '5%', marginRight: '5%', marginTop: '20px', zIndex: 0, position: 'relative'}}>
          {this.state.loading ? <CircularProgress variant="indeterminate"/> :
          <MUIDataTable
            columns = {this.state.columns}
            data = {this.state.courseList}
            options = {options}/>}
        </div><br/>
        {this.state.courseList.length > 0 ?
        <p style={{fontSize: '13px'}}>
        <b>Note:</b> This list is based on courses GU students have gotten credit
        for in the past, but you may be able to get other courses approved. </p> : null} <br/>
        <Snackbar message={this.state.message}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
          open={this.state.showMessage}
          onClose={(event) =>
            this.setState({showMessage: false})}
          autoHideDuration={3000} // Automatically hide message after 3 seconds (3000 ms)
          action={
          <IconButton
            onClick={(event) =>
              this.setState({showMessage: false})}>
          <CloseIcon/> </IconButton>}/>
          <Dialog id="dialog" open={this.state.showLogInPrompt}>
            <DialogTitle id="simple-dialog-title">You must log in to save a course!</DialogTitle>lo['m
            ;>Z']
            <div>
              <Button style={buttonStyle} variant="contained" component={Link} to="/login">
                Log in
              </Button>
              <Button style={buttonStyle} variant="contained" component={Link} to="/signup">
                Sign up
              </Button>
              <Button style={buttonStyle} variant="contained"
                onClick = {(event) =>
                  this.setState({showLogInPrompt : false})}>
                Close
              </Button>
            </div>
          </Dialog>
          <div style={{marginLeft: '5%', marginRight: '5%', marginTop: '20px', zIndex: 0, position: 'relative'}}>
            <AppBar position ="static" color="default">
              <Tabs
                value={this.state.value}
                onChange={this.handleTabChange}
                indicatorColor="primary"
                textColor="primary"
                variant="fullWidth"
              >
                <Tab label="Residence"/>
                <Tab label="Trips"/>
                <Tab label="Classes"/>
                <Tab label="Activities"/>
                <Tab label="Staff"/>
                <Tab label="Other"/>
              </Tabs>
            </AppBar>
            <SwipeableViews
              axis={theme.direction === "rtl" ? "x-reverse" : "x"}
              index={this.state.value}
              onChangeIndex={this.handleTabChangeIndex}
            >
              <TabContainer dir={theme.direction}>Residence</TabContainer>
              <TabContainer dir={theme.direction}>Trips</TabContainer>
              <TabContainer dir={theme.direction}>Classes</TabContainer>
              <TabContainer dir={theme.direction}>Activiities</TabContainer>
              <TabContainer dir={theme.direction}>Staff</TabContainer>
              <TabContainer dir={theme.direction}>Other</TabContainer>
            </SwipeableViews>
          </div>
      </div>
    );
  }
}

export default withStyles(styles, { withTheme: true })(ProgramDetailView);
