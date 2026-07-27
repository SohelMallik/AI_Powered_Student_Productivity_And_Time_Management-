# from django.shortcuts import render
# #We import HttpResponse to return a response to the user
# from django.http import HttpResponse
# #import UserCreationForm to create a user registration form
# from django.contrib.auth.forms import UserCreationForm

# # Create your views here.
# def register(request):
#     if request.method == 'POST':
#         form = UserCreationForm(request.POST)#This Is Built in from of django to create a user registration form
#         if form.is_valid():
#             form.save()
#             return HttpResponse("User registered successfully!")
#     else:
#         form = UserCreationForm()
#     return render(request, 'register.html', {'form': form})

from django.shortcuts import render, redirect
from django.contrib.auth.models import User
from django.contrib.auth import login
from django.contrib import messages


def register(request):
    if request.method == "POST":

        username = request.POST.get("username")
        email = request.POST.get("email")
        password1 = request.POST.get("password1")
        password2 = request.POST.get("password2")

        # Check if passwords match
        if password1 != password2:
            messages.error(request, "Passwords do not match.")
            return redirect("register")

        # Check if username already exists
        if User.objects.filter(username=username).exists():
            messages.error(request, "Username already exists.")
            return redirect("register")

        # Check if email already exists
        if User.objects.filter(email=email).exists():
            messages.error(request, "Email already exists.")
            return redirect("register")

        # Create user on Db
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password1
        )

        # Login the user automatically
        login(request, user)

        # Success message
        messages.success(request, f"Welcome {username}! Your account has been created successfully.")

        # Redirect to Todolist page
        return redirect("todolist")

    return render(request, "register.html")




