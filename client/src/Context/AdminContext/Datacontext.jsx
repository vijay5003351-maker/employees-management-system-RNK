import axios from 'axios';
import { createContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const DataContext = createContext({});

export const DataProvider = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();

    // useState Section

    const [inputData, setInputData] = useState({
        firstName: '',
        lastName: '',
        dob: '',
        email: '',
        password: '',
        username: '',
        gender: '',
        phone: '',
        address: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: '',
        },
        employmentDate: '',
        status: '',
        createdAt: new Date().toISOString().slice(0, 10),
        role: '',
    });

    const [bookRoom, setBookRoom] = useState({
        projectHead: '',
        roomsForMeeting: '',
        reasonForMeeting: '',
        bookingDate: '',
        meetingStartingTime: '',
        meetingEndingTime: '',
        additionalRequirement: '',
    });

    const [popUp, setPopUp] = useState(false);

    const [allEmp, setAllEmp] = useState([]);
    const [allManager, setAllManager] = useState([]);
    const [totalEmployee, setTotalEmployees] = useState();
    const [allCombined, setAllCombined] = useState([]);
    const [totalPresent, setTotalPresent] = useState(3);

    const [input, setInput] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState('');

    const [tasks, setTasks] = useState(() => {
        const savedTasks = localStorage.getItem('tasks');
        return savedTasks ? JSON.parse(savedTasks) : [];
    });

    const [newTask, setNewTask] = useState('');

    const [project, setProject] = useState({
        project_title: '',
        project_start_date: '',
        project_end_date: '',
        project_employee: '',
    });

    const [projectList, setProjectList] = useState([]);
    const [totalProjects, setTotalProjects] = useState();

    // useState Section ends

    useEffect(() => {
        if (location.state?.employeeId) {
            setInputData(location.state.employeeId);
        }
    }, [location.state]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const endpoint = location.state?.employeeId
                ? `${import.meta.env.VITE_API_URL}/fun/update`
                : `${import.meta.env.VITE_API_URL}/add-employee`;

            const formData = new FormData();

            // basic fields
            formData.append('firstName', inputData.firstName);
            formData.append('lastName', inputData.lastName);
            formData.append('dob', inputData.dob);
            formData.append('email', inputData.email);
            formData.append('password', inputData.password);
            formData.append('username', inputData.username);
            formData.append('gender', inputData.gender);
            formData.append('phone', inputData.phone);
            formData.append('employmentDate', inputData.employmentDate);
            formData.append('status', inputData.status);
            formData.append('role', inputData.role);
            formData.append('createdAt', inputData.createdAt);

            // address (IMPORTANT FIX)
            if (inputData.address) {
                Object.keys(inputData.address).forEach((key) => {
                    formData.append(`address[${key}]`, inputData.address[key]);
                });
            }

            // MULTIPLE IMAGES FIX
            if (inputData.images && inputData.images.length === 3) {
                inputData.images.forEach((file) => {
                    formData.append('images', file);
                });
            } else {
                alert('Please select exactly 3 images');
                return;
            }

            const response = await axios.post(endpoint, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            console.log('API Response:', response.data);

            await allUser();

            // RESET FORM
            setInputData({
                firstName: '',
                lastName: '',
                dob: '',
                email: '',
                password: '',
                username: '',
                gender: '',
                phone: '',
                address: {
                    street: '',
                    city: '',
                    state: '',
                    zipCode: '',
                    country: '',
                },
                employmentDate: '',
                status: '',
                createdAt: new Date().toISOString().slice(0, 10),
                role: '',
                images: [],
            });

            setPopUp({
                show: true,
                message: 'Employee data submitted successfully!',
                isSuccess: true,
            });

            setTimeout(() => {
                setPopUp({ show: false, message: '', isSuccess: true });
            }, 2000);
        } catch (error) {
            console.error('Error during submission:', error);

            setPopUp({
                show: true,
                message: 'Failed to submit employee data. Please try again.',
                isSuccess: false,
            });

            setTimeout(() => {
                setPopUp({ show: false, message: '', isSuccess: true });
            }, 3000);
        }
    };

    const handleClick = async (e) => {
        e.preventDefault();
        setProject({
            project_title: '',
            project_employee: '',
            project_start_date: '',
            project_end_date: '',
        });
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/fun/project`,
                project,
            );
            console.log(response.data);
            setPopUp({
                show: true,
                message: 'Project submitted successfully!',
                isSuccess: true,
            });

            setTimeout(() => {
                setPopUp({ show: false, message: '', isSuccess: true });
            }, 2000);
        } catch (error) {
            console.error('Error adding project:', error);
        }
    };

    // remainder to check

    const handleChange = (e) => {
        const { name, value } = e.target;

        setInput({ ...input, [name]: value });
        setProject({ ...project, [name]: value });
        setBookRoom({ ...bookRoom, [name]: value });

        if (name.startsWith('address[')) {
            const fieldName = name.slice(8, -1);
            setInputData((prev) => ({
                ...prev,
                address: {
                    ...prev.address,
                    [fieldName]: value,
                },
            }));
        } else {
            setInputData((prev) => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    // All Employee Functions

    const allUser = () => {
        axios
            .get(`${import.meta.env.VITE_API_URL}/fun/alluser`)
            .then((res) => {
                if (res.data && res.data.allEmployees) {
                    const managers = res.data.allEmployees.filter(
                        (employee) => employee.role === 'Manager',
                    );
                    setAllManager(managers);

                    const employees = res.data.allEmployees.filter(
                        (employee) => employee.role === 'Employee',
                    );
                    setAllEmp(employees);

                    const attendance = res.data.allEmployees.filter(
                        (employee) => employee.isPresent === true,
                    );
                    setTotalPresent(attendance);

                    const totalPresent = attendance.length;
                    const totalManagers = managers.length;
                    const totalEmployees = employees.length;
                    setTotalEmployees(totalManagers + totalEmployees);

                    setAllCombined(res.data.allEmployees);
                    setTotalPresent(totalPresent);
                }
            })
            .catch((err) => {
                console.log('Error Fetching User Data', err);
            });
    };

    const handleEmployeeDelete = (empId) => {
        axios
            .delete(`${import.meta.env.VITE_API_URL}/fun/employee/${empId}`)
            .then((res) => {
                console.log('Employee Deleted Successfully');
                allUser();
            })
            .catch((error) => {
                console.log('Error Deleting Employee', error);
            });
    };

    const handleProjectDelete = (empId) => {
        axios
            .delete(`${import.meta.env.VITE_API_URL}/fun/project/${empId}`)
            .then((res) => {
                console.log('Employee Deleted Successfully');
                allprojects();
            })
            .catch((error) => {
                console.log('Error Deleting Employee', error);
            });
    };

    const handleEdit = (employeeId) => {
        navigate('/aside/addemployee', { state: { employeeId } });
    };

    useEffect(() => {
        allUser();
    }, []);

    // Login pages Functions

    useEffect(() => {
        setInput({ email: '', password: '' });
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();

        console.log('hi hello');

        console.log('API URL:', import.meta.env.VITE_API_URL);
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/fun/login`,
                input,
            );

            console.log(response.data);

            if (response.data) {
                const { userType } = response.data;

                if (userType === 'admin') {
                    navigate('/aside');
                } else if (userType === 'manager') {
                    navigate('/manageraside');
                } else if (userType === 'employee') {
                    navigate('/userAside');
                } else {
                    setError('Unknown user type');
                }
            }
        } catch (error) {
            setError('Your Email or Password is Wrong, Try again');
            console.error('Error during login:', error);
        }
    };

    // Dashboard  page Functions

    useEffect(() => {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }, [tasks]);

    const addTask = () => {
        if (newTask.trim() === '') return;
        setTasks([
            ...tasks,
            { id: Date.now(), text: newTask, completed: false },
        ]);
        setNewTask('');
    };

    const toggleComplete = (id) => {
        setTasks(
            tasks.map((task) =>
                task.id === id ? { ...task, completed: !task.completed } : task,
            ),
        );
    };

    const deleteTask = (id) => {
        setTasks(tasks.filter((task) => task.id !== id));
    };

    // add Project function

    const allprojects = () => {
        axios
            .get(`${import.meta.env.VITE_API_URL}/fun/allprojects`)
            .then((res) => {
                if (res.data && res.data.allProjects) {
                    setProjectList(res.data.allProjects);
                    const TotalProjects = res.data.allProjects.length;
                    setTotalProjects(TotalProjects);
                    // console.log(TotalProjects);
                }
            })
            .catch((err) => {
                console.log('Error Fetching User Data');
            });
    };

    useEffect(() => {
        allprojects();
    }, []);

    const handleBookingRoom = async (e) => {
        e.preventDefault();
        setBookRoom({
            projectHead: '',
            roomsForMeeting: '',
            reasonForMeeting: '',
            bookingDate: '',
            meetingStartingTime: '',
            meetingEndingTime: '',
            additionalRequirement: '',
        });
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/project/room-booking`,
                bookRoom,
            );

            setPopUp({
                show: true,
                message: 'Meeting Room Booked successfully!',
                isSuccess: true,
            });

            setTimeout(() => {
                setPopUp({ show: false, message: '', isSuccess: true });
            }, 2000);

            setBookRoom({
                projectHead: '',
                roomsForMeeting: '',
                reasonForMeeting: '',
                bookingDate: '',
                meetingStartingTime: '',
                meetingEndingTime: '',
                additionalRequirement: '',
            });

            console.log('Successfully Booked Room', response);
        } catch (error) {
            console.error('Error Booking Room', error);
        }
    };

    return (
        <DataContext.Provider
            value={{
                handleSubmit,
                handleChange,
                setInputData,
                inputData,
                navigate,
                handleEdit,
                handleEmployeeDelete,
                handleProjectDelete,
                allUser,
                allEmp,
                setAllEmp,
                totalEmployee,
                input,
                setInput,
                handleLogin,
                error,
                setError,
                setNewTask,
                addTask,
                tasks,
                toggleComplete,
                deleteTask,
                setProject,
                project,
                handleClick,
                setProjectList,
                setTotalProjects,
                projectList,
                totalProjects,
                allprojects,
                setAllManager,
                allManager,
                setAllCombined,
                allCombined,
                popUp,
                setPopUp,
                totalPresent,
                setBookRoom,
                bookRoom,
                handleBookingRoom,
            }}
        >
            {children}
        </DataContext.Provider>
    );
};

export default DataContext;
